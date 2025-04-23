/* eslint-disable multiline-comment-style */

import Plugin from '../Plugin';
import createViewHandle from '../utils/createViewHandle';
import WebviewController, { ContainerType } from '../WebviewController';
import JoplinViewsBase, { Implementation } from './JoplinViewsBase';
import { ViewHandle } from './types';

/**
 * Allows creating and managing view panels. View panels allow displaying any HTML
 * content (within a webview) and updating it in real-time. For example it
 * could be used to display a table of content for the active note, or
 * display various metadata or graph.
 *
 * On desktop, view panels currently are displayed at the right of the sidebar, though can
 * be moved with "View" > "Change application layout".
 *
 * On mobile, view panels are shown in a tabbed dialog that can be opened using a
 * toolbar button.
 *
 * [View the demo plugin](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins/toc)
 */
export default class JoplinViewsPanels extends JoplinViewsBase {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private store: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public constructor(implementation: Implementation, plugin: Plugin, store: any) {
		super(implementation, plugin);
		this.store = store;
	}

	/**
	 * Creates a new panel
	 */
	public async create(id: string): Promise<ViewHandle> {
		if (!id) {
			this.plugin.deprecationNotice('1.5', 'Creating a view without an ID is deprecated. To fix it, change your call to `joplin.views.panels.create("my-unique-id")`', true);
			id = `${this.plugin.viewCount}`;
		}

		const handle = createViewHandle(this.plugin, id);
		const controller = new WebviewController(handle, this.plugin.id, this.store, this.plugin.baseDir, ContainerType.Panel);
		this.plugin.addViewController(controller);
		return handle;
	}

	/**
	 * Shows the panel
	 */
	public async show(handle: ViewHandle, show = true): Promise<void> {
		await this.controller(handle).show(show);
	}

	/**
	 * Hides the panel
	 */
	public async hide(handle: ViewHandle): Promise<void> {
		await this.show(handle, false);
	}

	/**
	 * Tells whether the panel is visible or not
	 */
	public async visible(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).visible;
	}

	public async isActive(handle: ViewHandle): Promise<boolean> {
		return this.controller(handle).isActive();
	}
}
