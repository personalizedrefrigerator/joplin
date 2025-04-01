
import { test, expect } from './util/test';
import MainScreen from './models/MainScreen';

test.describe('pluginApi', () => {
	test('the editor.setText command should update the current note (use RTE: false)', async ({ startAppWithPlugins }) => {
		const { app, mainWindow } = await startAppWithPlugins(['resources/test-plugins/execCommand.js']);
		const mainScreen = await new MainScreen(mainWindow).setup();
		await mainScreen.createNewNote('First note');
		const editor = mainScreen.noteEditor;

		await editor.focusCodeMirrorEditor();
		await mainWindow.keyboard.type('This content should be overwritten.');

		await editor.expectToHaveText('This content should be overwritten.');
		await mainScreen.goToAnything.runCommand(app, 'testUpdateEditorText');
		await editor.expectToHaveText('PASS');

		// Should still have the same text after switching notes:
		await mainScreen.createNewNote('Second note');
		await editor.goBack();

		await editor.expectToHaveText('PASS');
	});

	test('should be possible to create multiple toasts with the same text from a plugin', async ({ startAppWithPlugins }) => {
		const { app, mainWindow } = await startAppWithPlugins(['resources/test-plugins/showToast.js']);
		const mainScreen = await new MainScreen(mainWindow).setup();

		await mainScreen.goToAnything.runCommand(app, 'testShowToastNotification');
		const notificationLocator = mainWindow.getByText('Toast: This is a test info message.');
		await expect(notificationLocator).toBeVisible();

		// Running the command again, there should be two notifications with the same text.
		await mainScreen.goToAnything.runCommand(app, 'testShowToastNotification');
		await expect(notificationLocator.nth(1)).toBeVisible();
		await expect(notificationLocator.nth(0)).toBeVisible();

		await mainScreen.goToAnything.runCommand(app, 'testShowToastNotification');
		await expect(notificationLocator).toHaveCount(3);
	});

	test('should be possible to switch between multiple editor plugins', async ({ startAppWithPlugins }) => {
		const { mainWindow } = await startAppWithPlugins(['resources/test-plugins/editorPlugin.js']);
		const mainScreen = await new MainScreen(mainWindow).setup();

		await mainScreen.createNewNote('Test note');
		const toggleButton = mainScreen.noteEditor.toggleEditorPluginButton;

		// Initially, the toggle button should be visible, and so should the default editor.
		await expect(toggleButton).toBeVisible();
		await expect(mainScreen.noteEditor.codeMirrorEditor).toBeAttached();

		await toggleButton.click();

		const pluginFrame = mainWindow.locator('iframe[id^="plugin-view-org.joplinapp.plugins.example.editorPlugin"]');
		await expect(pluginFrame).toBeAttached();

		// Should describe the frame
		const frameViewIdLabel = pluginFrame.contentFrame().locator('#view-id-base');
		await expect(frameViewIdLabel).toHaveText('test-editor-plugin-1');

		// Clicking toggle again should cycle to the next editor plugin
		await toggleButton.click();
		await expect(frameViewIdLabel).toHaveText('test-editor-plugin-2');

		// Clicking toggle again should dismiss the editor plugins
		await toggleButton.click();
		await expect(mainScreen.noteEditor.codeMirrorEditor).toBeAttached();
		await expect(pluginFrame).not.toBeAttached();
	});
});

