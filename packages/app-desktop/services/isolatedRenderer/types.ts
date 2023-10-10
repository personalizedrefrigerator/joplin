import type { MarkupLanguage, Options } from "@joplin/renderer/MarkupToHtml";

export interface RenderingParams {
	markupLanguage: MarkupLanguage;
	markup: string;
	theme: any;
	options: Options;
}
