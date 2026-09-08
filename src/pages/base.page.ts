import { Page } from '@playwright/test';

export abstract class BasePage {
    protected readonly page: Page;

    protected constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string): Promise<void> {
        await this.page.goto(path);
    }

    async getTitle(): Promise<string> {
        return this.page.title();
    }
}
