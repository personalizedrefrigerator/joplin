import { defaultWindowId } from '@joplin/lib/reducer';
import * as React from 'react';
import { useState, useEffect, createContext } from 'react';
import { createPortal } from 'react-dom';
import { SecondaryWindowApi } from '../utils/window/types';
import windowPool, { SecondaryWindow } from './utils/windowPool';

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
	const [doc, setDoc] = useState<Document>(null);

	useEffect(() => {
		let openedWindow: SecondaryWindow|null = null;
		if (iframeElement) {
			setDoc(iframeElement?.contentWindow?.document);
		} else if (mode === WindowMode.NewWindow) {
			openedWindow = windowPool.open();
			setDoc(openedWindow.document);
		}

		return () => {
			if (mode === WindowMode.NewWindow && openedWindow) {
				windowPool.close(openedWindow);
				openedWindow = null;
			}
		};
	}, [iframeElement, mode]);

	return doc;
};

type OnSetLoaded = (loaded: boolean)=> void;
const useDocumentSetup = (doc: Document|null, setLoaded: OnSetLoaded) => {
	useEffect(() => {
		if (!doc) return;

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
		];
		for (const url of jsUrls) {
			const script = doc.createElement('script');
			script.src = url;
			doc.head.appendChild(script);
		}

		doc.body.style.height = '100vh';

		setLoaded(true);
	}, [doc, setLoaded]);
};

const NewWindowOrIFrame: React.FC<Props> = props => {
	const [iframeRef, setIframeRef] = useState<HTMLIFrameElement|null>(null);
	const [loaded, setLoaded] = useState(false);

	const doc = useDocument(props.mode, iframeRef);
	useDocumentSetup(doc, setLoaded);

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

	const parentNode = loaded ? doc?.body : null;
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
