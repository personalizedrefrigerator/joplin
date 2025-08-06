import { EditorEvent } from '@joplin/editor/events';
import { EditorControl, EditorSettings, OnLocalize, SearchState } from '@joplin/editor/types';
import { MarkupRecord, RendererControl } from '../rendererBundle/types';
import { RenderResult } from '@joplin/renderer/types';

export interface EditorProps {
	initialText: string;
	initialSearch: SearchState;
	initialNoteId: string;
	parentElementClassName: string;
	onLocalize: OnLocalize;
	settings: EditorSettings;
}

export interface EditorProcessApi {
	editor: EditorControl;
}

type RenderOptionsSlice = {
	pluginAssetContainerSelector: string;
	splitted: boolean;
	mapsToLine: true;
	removeUnusedPluginAssets: boolean;
};

export interface MainProcessApi {
	onEditorEvent(event: EditorEvent): Promise<void>;
	logMessage(message: string): Promise<void>;
	onRender(markup: MarkupRecord, options: RenderOptionsSlice): Promise<RenderResult>;
	onPasteFile(type: string, base64: string): Promise<void>;
}

export interface RichTextEditorControl {
	editor: EditorControl;
	renderer: RendererControl;
}
