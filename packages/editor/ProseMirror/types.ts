import { RenderResult } from '../../renderer/types';

export type MarkupToHtml = (markup: string)=> Promise<RenderResult>;
export type HtmlToMarkup = (html: HTMLElement)=> string;

export interface RendererControl {
	renderMarkupToHtml: MarkupToHtml;
	renderHtmlToMarkup: HtmlToMarkup;
}
