const { ipcRenderer } = require('electron');

window.electronWindow = {
	onSetWindowId: windowId => ipcRenderer.send('secondary-window-added', windowId),
	hide: () => ipcRenderer.send('secondary-window-hide'),
	show: () => ipcRenderer.send('secondary-window-show'),
};
