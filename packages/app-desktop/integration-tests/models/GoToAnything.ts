
import { ElectronApplication, expect, Locator, Page } from '@playwright/test';
import MainScreen from './MainScreen';
import activateMainMenuItem from '../util/activateMainMenuItem';

export default class GoToAnything {
	public readonly containerLocator: Locator;
	public readonly inputLocator: Locator;

	public constructor(page: Page, private readonly mainScreen: MainScreen) {
		this.containerLocator = page.locator('.go-to-anything-dialog[open]');
		this.inputLocator = this.containerLocator.getByRole('textbox');
	}

	public async waitFor() {
		await this.containerLocator.waitFor();
	}

	public async open(electronApp: ElectronApplication) {
		await this.mainScreen.waitFor();
		await activateMainMenuItem(electronApp, 'Goto Anything...');

		return this.waitFor();
	}

	public async openLinkToNote(electronApp: ElectronApplication) {
		await this.mainScreen.waitFor();
		await activateMainMenuItem(electronApp, 'Link to note...');
		return this.waitFor();
	}

	public resultLocator(resultText: string|RegExp) {
		return this.containerLocator.getByRole('option', { name: resultText });
	}

	public async searchForWithRetry(query: string, resultLocator: Locator) {
		// If note indexing hasn't finished, it's sometimes necessary to search multiple times.
		// This expect.poll retries the search if it initially fails.
		await expect.poll(async () => {
			await this.inputLocator.clear();
			await this.inputLocator.fill(query);
			await expect(resultLocator).toBeVisible({ timeout: 1600 });
			return true;
		}, { timeout: 12000 }).toBe(true);
	}

	public async expectToBeClosed() {
		await expect(this.containerLocator).not.toBeAttached();
	}

	public async expectToBeOpen() {
		await expect(this.containerLocator).toBeAttached();
	}

	public async runCommand(electronApp: ElectronApplication, command: string) {
		if (!command.startsWith(':')) {
			command = `:${command}`;
		}

		await this.open(electronApp);
		await this.inputLocator.fill(command);
		await this.containerLocator.locator('.match-highlight').first().waitFor();
		await this.inputLocator.press('Enter');
		await this.expectToBeClosed();
	}
}
