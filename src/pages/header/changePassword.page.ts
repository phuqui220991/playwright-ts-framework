import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import { Routes } from '@constants/routes';

export class ChangePasswordPage extends BasePage {
    private readonly heading: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'Update Password' });
    }

    async open(): Promise<void> {
        await this.goto(Routes.changePassword);
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.changePassword);
        await expect(this.heading).toBeVisible();
    }
}
