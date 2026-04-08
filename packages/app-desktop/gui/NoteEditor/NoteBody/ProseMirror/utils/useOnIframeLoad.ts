import { useCallback } from 'react';
import setUpWebviewApi from '../../utils/setUpWebviewApi';

const useOnIframeLoad = () => {
	return useCallback((doc: Document) => {
		const window = doc.defaultView;
		setUpWebviewApi(window);
	}, []);
};

export default useOnIframeLoad;
