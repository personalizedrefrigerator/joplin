import { RenderResult } from '../../renderer/types';
import { EditorControl, EditorSettings, OnEventCallback } from '../types';

interface MarkupToHtmlOptions {
	isFullPageRender: boolean;
	forceMarkdown: boolean;
}

export type MarkupToHtml = (markup: string, options: MarkupToHtmlOptions)=> Promise<RenderResult>;
export type HtmlToMarkup = (html: Node|DocumentFragment)=> string;

export interface RendererControl {
	renderMarkupToHtml: MarkupToHtml;
	renderHtmlToMarkup: HtmlToMarkup;
}

export type OnCreateTextEditor = (
	parent: HTMLElement, settings: EditorSettings, onEvent: OnEventCallback
)=> EditorControl;
