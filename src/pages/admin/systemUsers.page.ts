import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import { Routes } from '@constants/routes';

export class SystemUsersPage extends BasePage {
    private readonly heading: Locator;
    private readonly usernameInput: Locator;
    private readonly searchButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'System Users' });
        this.usernameInput = page
            .locator('div.oxd-input-group', { hasText: 'Username' })
            .locator('input');
        this.searchButton = page.getByRole('button', { name: 'Search' });
    }

    async open(): Promise<void> {
        await this.goto(Routes.viewSystemUsers);
    }

    async searchByUsername(username: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.searchButton.click();
    }

    userRow(username: string): Locator {
        return this.page.getByRole('row').filter({ hasText: username });
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.viewSystemUsers);
        await expect(this.heading).toBeVisible();
    }

    async expectUserVisible(username: string): Promise<void> {
        await expect(this.userRow(username)).toBeVisible();
    }
}
