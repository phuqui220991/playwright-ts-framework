import { expect, Page } from '@playwright/test';

export abstract class BasePage {
    protected readonly page: Page;

    protected constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string): Promise<void> {
        await this.page.goto(path);
    }

    /** Asserts the current URL path is exactly the given route (pass a value from `Routes`). */
    protected async expectRoute(route: string): Promise<void> {
        await expect(this.page).toHaveURL((url) => url.pathname === route);
    }
}
