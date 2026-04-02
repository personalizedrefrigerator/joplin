import { defaultWindowId } from '@joplin/lib/reducer';
import * as React from 'react';
import { useState, useEffect, createContext } from 'react';
import { createPortal } from 'react-dom';
import { SecondaryWindowApi } from '../utils/window/types';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('NewWindowOrIframe');

// This component uses react-dom's Portals to render its children in a different HTML
// document. As children are rendered in a different Window/Document, they should avoid
// referencing the `window` and `document` globals. Instead, HTMLElement.ownerDocument
// and refs can be used to access the child component's DOM.

export const WindowIdContext = createContext(defaultWindowId);

export enum WindowMode {
	Iframe, NewWindow,
}

interface Props {
	// Note: children will be rendered in a different DOM from this node. Avoid using document.* methods
	// in child components.
	children: React.ReactNode[]|React.ReactNode;
	title: string;
	mode: WindowMode;
	windowId: string;
}

const useDocument = (
	mode: WindowMode,
	iframeElement: HTMLIFrameElement|null,
) => {
	const [doc, setDoc] = useState<Document|null>(null);

	useEffect(() => {
		let openedWindow: Window|null = null;
		let unmounted = false;
		let doc;
		if (iframeElement) {
			doc = iframeElement?.contentWindow?.document;
		} else if (mode === WindowMode.NewWindow) {
			openedWindow = window.open('about:blank');
			doc = openedWindow.document;

			// .onbeforeunload and .onclose events don't seem to fire when closed by a user -- rely on polling
			// instead:
			void (async () => {
				while (!unmounted) {
					await new Promise<void>(resolve => {
						setTimeout(() => resolve(), 2000);
					});

					// Re-check after sleep to avoid duplicate WINDOW_CLOSE if IPC already fired.
					if (unmounted) break;

					if (openedWindow?.closed) {
						// Null out doc first so React stops rendering into the destroyed window
						// before WINDOW_CLOSE triggers unmounting (prevents renderer crash on Windows).
						setDoc(null);
						openedWindow = null;
						break;
					}
				}
			})();
		}
		setUpDocument(doc);
		setDoc(doc);

		return () => {
			unmounted = true;

			// Delay and use a helper running within the secondary window:
			// Closing from the main JS context causes Electron to crash.
			// See https://github.com/laurent22/joplin/pull/14988
			if (mode === WindowMode.NewWindow && openedWindow) {
				type SecondaryWindowUtils = Window & {
					scheduleClose: ()=> void;
				};
				const scheduleClose = (openedWindow as SecondaryWindowUtils).scheduleClose;

				// Edge case: scheduleClose hasn't been registered yet. Warn, rather than
				// throwing to prevent a crash:
				if (!scheduleClose) {
					logger.warn('Attempting to close window before a "scheduleClose" callback has been registered.');
				} else {
					scheduleClose();
				}
			}
		};
	}, [iframeElement, mode]);

	return doc;
};

const setUpDocument = (doc: Document) => {
	doc.open();
	doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
	doc.close();

	const cssUrls = [
		'style.min.css',
	];

	for (const url of cssUrls) {
		const style = doc.createElement('link');
		style.rel = 'stylesheet';
		style.href = url;
		doc.head.appendChild(style);
	}

	const jsUrls = [
		'vendor/lib/smalltalk/dist/smalltalk.min.js',
		'./utils/window/eventHandlerOverrides.js',
		'./utils/window/secondaryWindowUtils.js',
	];
	for (const url of jsUrls) {
		const script = doc.createElement('script');
		script.src = url;
		doc.head.appendChild(script);
	}

	doc.body.style.height = '100vh';
};

const NewWindowOrIFrame: React.FC<Props> = props => {
	const [iframeRef, setIframeRef] = useState<HTMLIFrameElement|null>(null);

	const doc = useDocument(props.mode, iframeRef);

	useEffect(() => {
		if (!doc) return;
		doc.title = props.title;
	}, [doc, props.title]);

	useEffect(() => {
		const win = doc?.defaultView;
		if (win && 'electronWindow' in win && typeof win.electronWindow === 'object') {
			const electronWindow = win.electronWindow as SecondaryWindowApi;
			electronWindow.onSetWindowId(props.windowId);
		}
	}, [doc, props.windowId]);

	const parentNode = doc?.body;
	const wrappedChildren = <WindowIdContext.Provider value={props.windowId}>{props.children}</WindowIdContext.Provider>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed to allow adding the portal to the DOM
	const contentPortal = parentNode && createPortal(wrappedChildren, parentNode) as any;
	if (props.mode === WindowMode.NewWindow) {
		return <div style={{ display: 'none' }}>{contentPortal}</div>;
	} else {
		return <iframe
			ref={setIframeRef}
			style={{ flexGrow: 1, width: '100%', height: '100%', border: 'none' }}
		>
			{contentPortal}
		</iframe>;
	}
};

export default NewWindowOrIFrame;
