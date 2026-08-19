import { expect, Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { HeaderComponent } from "../components/header.component";

export class DashboardPage extends BasePage {
    readonly header: HeaderComponent;

    constructor(page: Page) {
        super(page);
        this.header = new HeaderComponent(page);
    }

    async open() {
        await this.goto('/web/index.php/dashboard/index');
    }

    async expectLoaded() {
        await expect(this.page).toHaveURL(/\/dashboard\/index/);
    }
}