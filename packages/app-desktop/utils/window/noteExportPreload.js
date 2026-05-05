const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webviewApi', {
	postMessage: async (contentScriptId, message) => {
		const response = await ipcRenderer.invoke('export-window--plugin-message', contentScriptId, message);
		return response;
	},
});
