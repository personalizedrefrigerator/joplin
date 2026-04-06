
// To avoid Electron crashes, a window, once opened, lives until the
// application is closed.
// When closed by the user, such windows are hidden by the main process,
// but still exist in the background.
//
// Workaround for https://github.com/laurent22/joplin/issues/14968.
class WindowPool {
	private inUse_: Set<Window> = new Set();
	private unused_: Window[] = [];

	public constructor() { }

	public open() {
		let target;
		if (this.unused_.length > 0) {
			target = this.unused_.pop()!;
		} else {
			target = window.open('about:blank')!;
		}

		this.inUse_.add(target);
		return target;
	}

	public close(w: Window) {
		if (!this.inUse_.has(w)) {
			throw new Error('Window is either not in use or not managed by this WindowPool.');
		}

		this.inUse_.delete(w);
		w.document.head.replaceChildren();
		w.document.body.replaceChildren();
	}
}

const windowPool = new WindowPool();
export default windowPool;
