import { ElectronApplication } from '@playwright/test';
import { expect } from './test';

// Currently only supports mocking reading/writing text
const mockClipboard = async (electronApp: ElectronApplication, clipboardText: string) => {
	await electronApp.evaluate(async ({ clipboard }, clipboardText) => {
		clipboard.writeText = (text: string) => {
			clipboardText = text;
		};
		clipboard.readText = () => {
			return clipboardText;
		};
	}, clipboardText);

	return {
		expectClipboardToMatch: async (text: string) => {
			await expect.poll(() => electronApp.evaluate(async ({ clipboard }) => {
				return clipboard.readText();
			})).toBe(text);
		},
	};
};

export default mockClipboard;
