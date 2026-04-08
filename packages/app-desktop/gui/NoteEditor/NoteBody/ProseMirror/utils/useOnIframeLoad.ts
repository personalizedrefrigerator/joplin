import { useCallback } from 'react';
import setUpWebviewApi from '../../utils/setUpWebviewApi';
import { toForwardSlashes } from '@joplin/utils/path';
import { join } from 'path';
import bridge from '../../../../../services/bridge';


let stylesUrl_: string|undefined = undefined;
const getStylesUrl = () => {
	stylesUrl_ ??= `file://${
		toForwardSlashes(join(bridge().vendorDir(), 'ProseMirror', 'styles.bundle.css'))
	}`;
	return stylesUrl_ ?? '';
};

const useOnIframeLoad = () => {
	return useCallback((doc: Document) => {
		const window = doc.defaultView;
		setUpWebviewApi(window);

		const styleLink = document.createElement('link');
		styleLink.rel = 'stylesheet';
		styleLink.href = getStylesUrl();
		doc.head.appendChild(styleLink);
	}, []);
};

export default useOnIframeLoad;
