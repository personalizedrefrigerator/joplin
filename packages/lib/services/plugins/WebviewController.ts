import ViewController, { EmitMessageEvent } from './ViewController';
import shim from '../../shim';
import { ButtonSpec, DialogResult, ViewHandle } from './api/types';
const { toSystemSlashes } = require('../../path-utils');
import PostMessageService, { MessageParticipant } from '../PostMessageService';
import { PluginEditorViewState, PluginViewState } from './reducer';
import { defaultWindowId } from '../../reducer';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('WebviewController');

export enum ContainerType {
	Panel = 'panel',
	Dialog = 'dialog',
	Editor = 'editor',
}

export interface Options {
	containerType: ContainerType;
}

interface CloseResponse {
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	resolve: Function;
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	reject: Function;
}

// TODO: Copied from:
// packages/app-desktop/gui/ResizableLayout/utils/findItemByKey.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function findItemByKey(layout: any, key: string): any {
	if (!layout) throw new Error('Layout cannot be null');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	function recurseFind(item: any): any {
		if (item.key === key) return item;

		if (item.children) {
			for (const child of item.children) {
				const found = recurseFind(child);
				if (found) return found;
			}
		}
		return null;
	}

	return recurseFind(layout);
}

interface EditorUpdateEvent {
	noteId: string;
	newBody: string;
	windowId: string;
}
type EditorUpdateListener = (event: EditorUpdateEvent)=> void;

interface SaveNoteEvent {
	noteId: string;
	body: string;
}
type OnSaveNoteCallback = (saveNoteEvent: SaveNoteEvent)=> void;

export default class WebviewController extends ViewController {

	private baseDir_: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	private messageListener_: Function = null;
	private updateListener_: EditorUpdateListener|null = null;
	private closeResponse_: CloseResponse = null;
	private containerType_: ContainerType = null;
	private saveNoteListeners_: OnSaveNoteCallback[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public constructor(handle: ViewHandle, pluginId: string, store: any, baseDir: string, containerType: ContainerType, parentWindowId: string|null) {
		super(handle, pluginId, store);
		this.baseDir_ = toSystemSlashes(baseDir, 'linux');
		this.containerType_ = containerType;

		const view: PluginViewState = {
			id: this.handle,
			type: this.type,
			containerType: containerType,
			html: '',
			scripts: [],
			buttons: null,
			fitToContent: true,
			// Opened is used for dialogs and mobile panels (which are shown
			// like dialogs):
			opened: containerType === ContainerType.Panel,
			active: false,
			parentWindowId,
		};

		this.store.dispatch({
			type: 'PLUGIN_VIEW_ADD',
			pluginId: pluginId,
			view,
		});
	}

	public get type(): string {
		return 'webview';
	}

	// Returns `null` if the view can be shown in any window.
	public get parentWindowId(): string {
		return this.storeView.parentWindowId;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private setStoreProp(name: string, value: any) {
		this.store.dispatch({
			type: 'PLUGIN_VIEW_PROP_SET',
			pluginId: this.pluginId,
			id: this.handle,
			name: name,
			value: value,
		});
	}

	public get html(): string {
		return this.storeView.html;
	}

	public set html(html: string) {
		this.setStoreProp('html', html);
	}

	public get containerType(): ContainerType {
		return this.storeView.containerType;
	}

	public async addScript(path: string) {
		const fullPath = toSystemSlashes(shim.fsDriver().resolve(`${this.baseDir_}/${path}`), 'linux');

		if (fullPath.indexOf(this.baseDir_) !== 0) throw new Error(`Script appears to be outside of plugin base directory: ${fullPath} (Base dir: ${this.baseDir_})`);

		this.store.dispatch({
			type: 'PLUGIN_VIEW_PROP_PUSH',
			pluginId: this.pluginId,
			id: this.handle,
			name: 'scripts',
			value: fullPath,
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public postMessage(message: any) {
		const messageId = `plugin_${Date.now()}${Math.random()}`;

		void PostMessageService.instance().postMessage({
			pluginId: this.pluginId,
			viewId: this.handle,
			windowId: defaultWindowId,
			contentScriptId: null,
			from: MessageParticipant.Plugin,
			to: MessageParticipant.UserWebview,
			id: messageId,
			content: message,
		});

	}

	public async emitMessage(event: EmitMessageEvent) {
		if (!this.messageListener_) return;

		return this.messageListener_(event.message);
	}

	public emitUpdate(event: EditorUpdateEvent) {
		if (!this.updateListener_) return;

		if (this.containerType_ === ContainerType.Editor && (!this.isActive() || !this.isVisible())) {
			logger.info('emitMessage: Not emitting update because editor is disabled or hidden:', this.pluginId, this.handle, this.isActive(), this.isVisible());
			return;
		}

		this.updateListener_(event);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public onMessage(callback: any) {
		this.messageListener_ = callback;
	}

	public onUpdate(callback: EditorUpdateListener) {
		this.updateListener_ = callback;
	}

	// ---------------------------------------------
	// Specific to panels
	// ---------------------------------------------

	private showWithAppLayout() {
		return this.containerType === ContainerType.Panel && !!this.store.getState().mainLayout;
	}

	public async show(show = true): Promise<void> {
		if (this.showWithAppLayout()) {
			this.store.dispatch({
				type: 'MAIN_LAYOUT_SET_ITEM_PROP',
				itemKey: this.handle,
				propName: 'visible',
				propValue: show,
			});
		} else {
			this.setStoreProp('opened', show);
		}
	}

	public async hide(): Promise<void> {
		return this.show(false);
	}

	public get visible(): boolean {
		const appState = this.store.getState();

		// Mobile: There is no appState.mainLayout
		if (!this.showWithAppLayout()) {
			return this.storeView.opened;
		}

		const mainLayout = appState.mainLayout;
		const item = findItemByKey(mainLayout, this.handle);
		return item ? item.visible : false;
	}

	// ---------------------------------------------
	// Specific to dialogs
	// ---------------------------------------------

	public async open(): Promise<DialogResult> {
		if (this.closeResponse_) {
			this.closeResponse_.resolve(null);
			this.closeResponse_ = null;
		}

		this.store.dispatch({
			type: 'VISIBLE_DIALOGS_ADD',
			name: this.handle,
		});

		this.setStoreProp('opened', true);

		// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
		return new Promise((resolve: Function, reject: Function) => {
			this.closeResponse_ = { resolve, reject };
		});
	}

	public close() {
		this.store.dispatch({
			type: 'VISIBLE_DIALOGS_REMOVE',
			name: this.handle,
		});

		this.setStoreProp('opened', false);
	}

	public closeWithResponse(result: DialogResult) {
		this.close();
		this.closeResponse_.resolve(result);
		this.closeResponse_ = null;
	}

	public get buttons(): ButtonSpec[] {
		return this.storeView.buttons;
	}

	public set buttons(buttons: ButtonSpec[]) {
		this.setStoreProp('buttons', buttons);
	}

	public get fitToContent(): boolean {
		return this.storeView.fitToContent;
	}

	public set fitToContent(fitToContent: boolean) {
		this.setStoreProp('fitToContent', fitToContent);
	}

	// ---------------------------------------------
	// Specific to editors
	// ---------------------------------------------

	public setActive(active: boolean) {
		this.setStoreProp('active', active);
	}

	public isActive(): boolean {
		const state = this.storeView as PluginEditorViewState;
		return state.active;
	}

	public isVisible(): boolean {
		const state = this.storeView as PluginEditorViewState;
		if (!state.active) return false;
		return state.active && state.opened;
	}

	public async setVisible(visible: boolean) {
		await this.setStoreProp('opened', visible);
	}

	public async requestSaveNote(event: SaveNoteEvent) {
		for (const listener of this.saveNoteListeners_) {
			listener(event);
		}
	}

	public addRequestSaveNoteListener(listener: OnSaveNoteCallback) {
		this.saveNoteListeners_.push(listener);
		return {
			remove: () => {
				this.saveNoteListeners_ = this.saveNoteListeners_.filter(other => other !== listener);
			},
		};
	}
}
