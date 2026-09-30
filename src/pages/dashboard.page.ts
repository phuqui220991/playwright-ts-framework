import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import { HeaderComponent } from '@components/header.component';
import { SideNavComponent } from '@components/sideNav.component';
import { Routes } from '@constants/routes';

export class DashboardPage extends BasePage {
    readonly header: HeaderComponent;
    readonly sideNav: SideNavComponent;
    private readonly heading: Locator;

    constructor(page: Page) {
        super(page);
        this.header = new HeaderComponent(page);
        this.sideNav = new SideNavComponent(page);

        this.heading = page.getByRole('heading', { name: 'Dashboard' });
    }

    async open(): Promise<void> {
        await this.goto(Routes.dashboard);
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.dashboard);
        await expect(this.heading).toBeVisible();
    }
}
