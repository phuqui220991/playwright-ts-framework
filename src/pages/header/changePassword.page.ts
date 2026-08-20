import { expect, Page } from "@playwright/test";
import { BasePage } from "../base.page";

export class ChangePasswordPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async expectLoaded() {
        await expect(this.page).toHaveURL(/\/pim\/updatePassword/);
        await expect(this.page.getByRole('heading', { name: 'Update Password' })).toBeVisible();
    }
}