import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import { Routes } from '@constants/routes';

export class SupportPage extends BasePage {
    private readonly heading: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'Getting Started with OrangeHRM' });
    }

    async open(): Promise<void> {
        await this.goto(Routes.support);
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.support);
        await expect(this.heading).toBeVisible();
    }
}
