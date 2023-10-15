import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import uuid from '@joplin/lib/uuid';
import { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import { join } from 'path';
import { MarkupToHtmlConverter, RenderResult, RenderResultPluginAsset } from '@joplin/renderer/types';
import { MainToSandboxMessage, RendererSetupOptions, SandboxMessageType, SandboxToMainMessage } from './types';
import { Options as NoteStyleOptions } from '@joplin/renderer/noteStyle';

export default class IsolatedMarkupToHtml implements MarkupToHtmlConverter {
	private iframe: HTMLIFrameElement;

	private sandboxInitialized = false;
	private initializingSandbox = false;
	private sandboxInitializationListeners: (()=> void)[] = [];

	public constructor(private globalOptions: RendererSetupOptions) {
		this.iframe = document.createElement('iframe');
		this.iframe.src = join(__dirname, 'renderer', 'index.html');

		// Note: Do not enable both allow-scripts and allow-same-origin as this
		// breaks the sandbox. See
		// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		this.iframe.setAttribute('sandbox', 'allow-scripts');

		void this.initializeSandbox();

		document.body.appendChild(this.iframe);
		this.iframe.style.display = 'none';
	}

	public destroy() {
		this.iframe.remove();
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

		this.postMessage({
			kind: SandboxMessageType.SetOptions,
			options: this.globalOptions,
		});


		this.initializingSandbox = false;
		this.sandboxInitialized = true;

		for (const listener of this.sandboxInitializationListeners) {
			listener();
		}
	}


	private postMessage(message: MainToSandboxMessage) {
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

				if (event.origin !== this.iframe.contentWindow.origin) {
					console.warn(`Ignored event from origin ${event.origin} expected origin to be ${this.iframe.contentWindow.origin}`);
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

	public setPlugins(plugins: PluginStates) {
		this.postMessage({
			kind: SandboxMessageType.SetPlugins,
			plugins,
		});
	}

	public async clearCache(markupLanguage: MarkupLanguage) {
		await this.initializeSandbox();

		this.postMessage({
			kind: SandboxMessageType.ClearCache,
			language: markupLanguage,
		});
	}

	public async render(
		markupLanguage: MarkupLanguage, markup: string, theme: any, options: any,
	): Promise<RenderResult> {
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
				audioPlayerEnabled: options.audioPlayerEnabled ?? false,
				videoPlayerEnabled: options.videoPlayerEnabled ?? false,
				pdfViewerEnabled: options.pdfViewerEnabled ?? false,
				noteId: options.noteId,
			},

			responseId,
		});

		const response = await messageResponsePromise;
		if (response.kind === SandboxMessageType.RenderResult) {
			return response.result;
		} else if (response.kind === SandboxMessageType.RenderError) {
			throw new Error(response.errorMessage);
		}

		throw new Error(`Invalid response, ${response.kind}`);
	}

	public stripMarkup(_markupLanguage: MarkupLanguage, _markup: string, _options: any): string {
		throw new Error('Method not implemented.');
	}

	public allAssets(_markupLanguage: MarkupLanguage, _theme: any, _noteStyleOptions: NoteStyleOptions): Promise<RenderResultPluginAsset[]> {
		throw new Error('Method not implemented.');
	}
}
