import { test, expect } from './util/test';
import MainScreen from './models/MainScreen';
import NoteEditorScreen from './models/NoteEditorScreen';
import { ElectronApplication, Page } from '@playwright/test';
import { BrowserWindow } from 'electron';

const closeWindow = async (page: Page, electronApp: ElectronApplication) => {
	const browserWindow = await electronApp.browserWindow(page);
	// Call window.close through the BrowserWindow so that the Electron close event handlers
	// run:
	await browserWindow.evaluate((window: BrowserWindow) => {
		window.close();
	});
};

test.describe('multiWindow', () => {
	for (const count of [1, 8]) {
		test(`should support quickly creating, then closing ${count} secondary window(s)`, async ({ mainWindow, electronApp }) => {
			const mainPage = await new MainScreen(mainWindow).setup();
			await mainPage.createNewNote('Test');

			const windows = [];
			for (let i = 0; i < count; i++) {
				const window = await mainPage.openNewWindow(electronApp);

				// Should load successfully
				const screen = new NoteEditorScreen(window);
				await screen.waitFor();

				windows.push(window);
			}

			// Close them all, very quickly.
			for (const window of windows) {
				await closeWindow(window, electronApp);
			}

			// Should not have crashed
			await expect(await mainPage.noteEditor.contentLocator()).toBeVisible();
		});
	}
});
