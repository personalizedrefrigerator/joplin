/* eslint-disable multiline-comment-style */

import Plugin from '../Plugin';
import WebviewController from '../WebviewController';
import { ViewHandle } from './types';

export interface Implementation {
	getWebViewAssetUri(filePath: string): Promise<string>;
}

/**
 * Methods applicable to any plugin WebView type (dialogs, panels, etc).
 */
export default class JoplinViewsBase {
	protected readonly plugin: Plugin;
	private readonly baseImplementation_: Implementation;

	public constructor(implementation: Implementation, plugin: Plugin) {
		this.plugin = plugin;
		this.baseImplementation_ = implementation;
	}

	protected controller(handle: ViewHandle): WebviewController {
		return this.plugin.viewController(handle) as WebviewController;
	}

	/**
	 * Sets the WebView's HTML content
	 */
	public async setHtml(handle: ViewHandle, html: string) {
		return this.controller(handle).html = html;
	}

	/**
	 * Adds and loads a new JS or CSS files into the WebView.
	 */
	public async addScript(handle: ViewHandle, scriptPath: string) {
		return this.controller(handle).addScript(scriptPath);
	}

	/**
	 * Called when a message is sent from the webview (using postMessage).
	 *
	 * To post a message from the webview to the plugin use:
	 *
	 * ```javascript
	 * const response = await webviewApi.postMessage(message);
	 * ```
	 *
	 * - `message` can be any JavaScript object, string or number
	 * - `response` is whatever was returned by the `onMessage` handler
	 *
	 * Using this mechanism, you can have two-way communication between the
	 * plugin and webview.
	 *
	 * See the [postMessage
	 * demo](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins/post_messages) for more details.
	 *
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	public async onMessage(handle: ViewHandle, callback: Function): Promise<void> {
		return this.controller(handle).onMessage(callback);
	}

	/**
	 * Sends a message to the webview.
	 *
	 * The webview must have registered a message handler prior, otherwise the message is ignored. Use;
	 *
	 * ```javascript
	 * webviewApi.onMessage((message) => { ... });
	 * ```
	 *
	 *  - `message` can be any JavaScript object, string or number
	 *
	 * The view API may have only one onMessage handler defined.
	 * This method is fire and forget so no response is returned.
	 *
	 * It is particularly useful when the webview needs to react to events emitted by the plugin or the joplin api.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public postMessage(handle: ViewHandle, message: any): void {
		return this.controller(handle).postMessage(message);
	}

	/**
	 * Returns a URI that allows accessing the specified asset from within
	 * the WebView.
	 *
	 * The form of this URI varies between platforms and may change in the future.
	 */
	public getAssetUri(_handle: ViewHandle, assetPath: string): Promise<string> {
		// TODO: Use `_handle` for a more efficient implementation on web.
		return this.baseImplementation_.getWebViewAssetUri(assetPath);
	}
}
