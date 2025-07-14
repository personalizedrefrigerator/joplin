import { OnMessageEvent } from '../components/ExtendedWebView/types';

interface WebViewEventHandlers {
	onLoadEnd: ()=> void;
	onMessage: (event: OnMessageEvent)=> void;
}

interface PageSetupCode {
	css: string;
	js: string;
}

export interface SetUpResult<Api> {
	api: Api;
	pageSetup: PageSetupCode;
	webViewEventHandlers: WebViewEventHandlers;
}
