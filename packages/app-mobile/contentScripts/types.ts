import { OnMessageEvent } from '../components/ExtendedWebView/types';

interface WebViewEventHandlers {
	onLoadEnd: ()=> void;
	onMessage: (event: OnMessageEvent)=> void;
}

export interface SetUpResult<Api> {
	api: Api;
	injectedJavaScript: string;
	webViewEventHandlers: WebViewEventHandlers;
}
