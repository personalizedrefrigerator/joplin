
// To avoid Electron crashes, a window, once opened, lives until the
// application is closed.
// When closed by the user, such windows are hidden by the main process,
// but still exist in the background.
//
// Workaround for https://github.com/laurent22/joplin/issues/14968.

import { SecondaryWindowApi } from '../../utils/window/types';

export interface SecondaryWindow extends Window {
	electronWindow: SecondaryWindowApi;
}

class WindowPool {
	private inUse_: Set<SecondaryWindow> = new Set();
	private unused_: SecondaryWindow[] = [];

	public constructor() { }

	public open() {
		let target;
		if (this.unused_.length > 0) {
			target = this.unused_.pop();
		} else {
			target = window.open('about:blank') as SecondaryWindow;
		}

		this.inUse_.add(target);
		return target;
	}

	public close(w: SecondaryWindow) {
		if (!this.inUse_.has(w)) {
			throw new Error('Window is either not in use or not managed by this WindowPool.');
		}

		w.electronWindow.hide();

		this.inUse_.delete(w);
		w.document.head.replaceChildren();
		w.document.body.replaceChildren();
	}
}

const windowPool = new WindowPool();
export default windowPool;
