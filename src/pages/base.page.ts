import { Page } from '@playwright/test';

export abstract class BasePage {
    protected constructor(protected readonly page: Page) {}

    async goto(path: string): Promise<void> {
        await this.page.goto(path);
    }

    async getTitle(): Promise<string> {
        return this.page.title();
    }
}
