import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '@components/header.component';
import { Routes } from '@constants/routes';

export class DashboardPage extends BasePage {
    readonly header: HeaderComponent;

    constructor(page: Page) {
        super(page);
        this.header = new HeaderComponent(page);
    }

    async open(): Promise<void> {
        await this.goto(Routes.dashboard);
    }

    async expectLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(/\/dashboard\/index/);
    }
}
