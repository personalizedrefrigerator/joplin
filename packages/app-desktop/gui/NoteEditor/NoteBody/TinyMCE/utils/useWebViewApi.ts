import { useEffect } from 'react';
import { Editor } from 'tinymce';
import setUpWebviewApi from '../../utils/setUpWebviewApi';

interface WebViewApi {
	postMessage: (contentScriptId: string, message: unknown)=> Promise<unknown>;
}

interface ExtendedWindow extends Window {
	webviewApi: WebViewApi;
}

const useWebViewApi = (editor: Editor, containerWindow: Window) => {
	useEffect(() => {
		if (!editor) return ()=>{};
		if (!containerWindow) return ()=>{};

		const editorWindow = editor.getWin() as ExtendedWindow;
		const { remove } = setUpWebviewApi(editorWindow);

		return () => {
			remove();
		};
	}, [editor, containerWindow]);
};

export default useWebViewApi;
