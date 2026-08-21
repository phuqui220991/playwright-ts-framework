import { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class SupportPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async expectLoaded() {
        await expect(this.page).toHaveURL(/\/help\/support/);
        await expect(
            this.page.getByRole('heading', { name: 'Getting Started with OrangeHRM' }),
        ).toBeVisible();
    }
}
