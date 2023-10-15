import uuid from '@joplin/lib/uuid';
import MarkupToHtml, { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import { join } from 'path';
import { MarkupToHtmlConverter, RenderResult, RenderResultPluginAsset } from '@joplin/renderer/types';
import { MainToSandboxMessage, RendererSetupOptions, SandboxMessageType, SandboxToMainMessage } from './types';
import { Options as NoteStyleOptions } from '@joplin/renderer/noteStyle';
import readPluginFiles from './utils/readPluginFiles';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('IsolatedMarkupToHtml');

export default class IsolatedMarkupToHtml implements MarkupToHtmlConverter {
	private iframe: HTMLIFrameElement;
	private destroyed = false;

	private sandboxInitialized = false;
	private initializingSandbox = false;

	// Listeners for the sandbox to be fully loaded
	private sandboxInitializationListeners: (()=> void)[] = [];

	// Listeners for any ongoing renders/asset calls to finish.
	private endOfOngoingTaskListeners: (()=> void)[] = [];

	private activeTaskCount = 0;

	// We keep an unsandboxed MarkupToHtml for synchronous calls that do
	// not need access to plugins.
	private unsandboxedMarkupToHtml: MarkupToHtmlConverter|null = null;

	public constructor(private globalOptions: RendererSetupOptions) {
		this.iframe = document.createElement('iframe');
		this.iframe.src = join(__dirname, 'renderer', 'index.html');

		// Note: Do not enable both allow-scripts and allow-same-origin as this
		// breaks the sandbox. See
		// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		this.iframe.setAttribute('sandbox', 'allow-scripts');

		void this.initializeSandbox();

		// We need to add the iframe to the document for it to load
		document.documentElement.appendChild(this.iframe);
		this.iframe.style.display = 'none';
	}

	public async destroy() {
		// Ensure that this iframe has been set up correctly
		await this.initializeSandbox();

		// Ensure that no rendering tasks are using the iframe
		await this.waitForRenderersToFinish();

		this.iframe.remove();
		this.destroyed = true;
	}

	private async initializeSandbox() {
		if (this.sandboxInitialized) {
			return;
		}

		if (this.initializingSandbox) {
			return new Promise<void>(resolve => {
				this.sandboxInitializationListeners.push(() => resolve());
			});
		}

		this.initializingSandbox = true;
		await this.getNextMessageSatisfying(message => message.kind === SandboxMessageType.SandboxLoaded);

		// Allows identifying replies
		const responseId = uuid.create();

		const plugins = await readPluginFiles(this.globalOptions.pluginStates);
		this.postMessage({
			kind: SandboxMessageType.SetOptions,
			options: this.globalOptions,
			plugins,
			responseId,
		});

		let response = await this.getNextResponseWithId(responseId);

		if (response.kind === SandboxMessageType.Error) {
			if (response.unusable) {
				this.initializingSandbox = false;
				throw new Error(response.errorMessage);
			} else {
				logger.error(`Nonfatal error loading the renderer: ${response.errorMessage}`);
			}

			response = await this.getNextResponseWithId(responseId);
		}

		if (response.kind !== SandboxMessageType.OptionsLoaded) {
			this.initializingSandbox = false;
			throw new Error(`Invalid render initialization response, ${JSON.stringify(response)}`);
		}

		this.initializingSandbox = false;
		this.sandboxInitialized = true;

		for (const listener of this.sandboxInitializationListeners) {
			listener();
		}
	}


	private postMessage(message: MainToSandboxMessage) {
		if (this.destroyed) {
			throw new Error('The markup renderer has already been destroyed.');
		}

		this.iframe.contentWindow.postMessage(
			message,
			// Doesn't work (gives error about null origin)
			// this.iframe.contentWindow.origin,
			'*',
		);
	}

	private getNextMessageSatisfying(condition: (message: SandboxToMainMessage)=> boolean) {
		return new Promise<SandboxToMainMessage>((resolve, _reject) => {

			const messageListener = (event: MessageEvent) => {
				// Determine the source of the event and only continue if it's
				// from our iframe.
				// See https://stackoverflow.com/a/71561712
				if (event.source !== this.iframe.contentWindow) {
					return;
				}

				if (!condition(event.data)) {
					return;
				}

				const message = event.data as SandboxToMainMessage;

				window.removeEventListener('message', messageListener);
				resolve(message);
			};

			window.addEventListener('message', messageListener);
		});
	}

	private getNextResponseWithId(senderId: string) {
		return this.getNextMessageSatisfying(message => {
			return message.responseId === senderId;
		});
	}

	public async clearCache(markupLanguage: MarkupLanguage) {
		await this.initializeSandbox();

		this.postMessage({
			kind: SandboxMessageType.ClearCache,
			language: markupLanguage,
		});
	}

	private async runAsyncTask<T>(task: ()=> Promise<T>): Promise<T> {
		this.activeTaskCount++;

		try {
			return await task();
		} finally {
			this.activeTaskCount--;

			if (this.activeTaskCount === 0) {
				for (const listener of this.endOfOngoingTaskListeners) {
					listener();
				}
				this.endOfOngoingTaskListeners = [];
			}
		}
	}

	public async render(
		markupLanguage: MarkupLanguage, markup: string, theme: any, options: any,
	): Promise<RenderResult> {
		return this.runAsyncTask(async () => {
			// Ensure that the sandbox is ready before continuing
			await this.initializeSandbox();

			options = {
				...options,

				// Not transferable
				ResourceModel: undefined,
			};

			// A unique ID that allows us to identify this render request
			const responseId = uuid.create();

			// Wait for a response before posting the message so that even
			// in an extreme (currently impossible?) case where the sandbox
			// replies immediately, we'll stil get the response.
			const messageResponsePromise = this.getNextResponseWithId(responseId);

			this.postMessage({
				kind: SandboxMessageType.Render,
				markupLanguage,
				markup,
				options: {
					theme,
					audioPlayerEnabled: options.audioPlayerEnabled ?? true,
					videoPlayerEnabled: options.videoPlayerEnabled ?? true,
					pdfViewerEnabled: options.pdfViewerEnabled ?? true,
					mapsToLine: options.mapsToLine ?? false,
					noteId: options.noteId,
					resources: options.resources,
				},

				responseId,
			});

			const response = await messageResponsePromise;
			if (response.kind === SandboxMessageType.RenderResult) {
				return response.result;
			} else if (response.kind === SandboxMessageType.Error) {
				throw new Error(response.errorMessage);
			}

			throw new Error(`Invalid response, ${response.kind}`);
		});
	}

	private waitForRenderersToFinish() {
		return new Promise<void>(resolve => {
			if (this.activeTaskCount === 0) {
				resolve();
			} else {
				this.endOfOngoingTaskListeners.push(() => resolve());
			}
		});
	}

	public stripMarkup(markupLanguage: MarkupLanguage, markup: string, options: any): string {
		this.unsandboxedMarkupToHtml ??= new MarkupToHtml();

		// Pass only collapseWhiteSpaces to prevent accidental rendering
		// with plugins.
		const stripMarkupOptions = {
			collapseWhiteSpaces: options.collapseWhiteSpaces,
		};

		return this.unsandboxedMarkupToHtml.stripMarkup(
			markupLanguage,
			markup,
			stripMarkupOptions,
		);
	}

	public allAssets(markupLanguage: MarkupLanguage, theme: any, noteStyleOptions: NoteStyleOptions): Promise<RenderResultPluginAsset[]> {
		return this.runAsyncTask(async () => {
			const responseId = uuid.create();

			this.postMessage({
				kind: SandboxMessageType.GetAssets,
				language: markupLanguage,
				theme,
				noteStyleOptions,
				responseId,
			});

			const response = await this.getNextResponseWithId(responseId);

			if (response.kind === SandboxMessageType.Error) {
				throw new Error(response.errorMessage);
			} else if (response.kind !== SandboxMessageType.AssetsResult) {
				throw new Error(`Invalid response to allAssets message: ${JSON.stringify(response)}`);
			}

			return response.assets;
		});
	}
}
