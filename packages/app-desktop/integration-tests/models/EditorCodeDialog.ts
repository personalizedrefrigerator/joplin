import { Locator, Page } from '@playwright/test';

export default class EditorCodeDialog {
	private readonly dialog: Locator;
	public readonly textArea: Locator;

	public constructor(page: Page) {
		this.dialog = page.getByRole('dialog', { name: 'Edit' });
		this.textArea = this.dialog.locator('textarea');
	}

	public async waitFor() {
		await this.dialog.waitFor();
		await this.textArea.waitFor();
	}
}
