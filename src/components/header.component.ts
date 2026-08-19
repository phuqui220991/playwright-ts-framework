import { expect, Locator, Page } from "@playwright/test";

export class HeaderComponent {
    readonly page: Page;
    readonly headerUsermenu: Locator;
    readonly aboutLink: Locator;
    readonly supportLink: Locator;
    readonly changePasswordLink: Locator;
    readonly logoutLink: Locator;
    readonly aboutModal: Locator;
    readonly aboutModalCloseButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.headerUsermenu = page.locator('.oxd-userdropdown-tab');
        this.aboutLink = page.getByRole('menuitem', { name: 'About' });
        this.supportLink = page.getByRole('menuitem', { name: 'Support' });
        this.changePasswordLink = page.getByRole('menuitem', { name: 'Change Password' });
        this.logoutLink = page.getByRole('menuitem', { name: 'Logout' });
        this.aboutModal = page.locator('.oxd-dialog-container-default');
        this.aboutModalCloseButton = this.aboutModal.locator('.oxd-dialog-close-button');
    }

    async openAbout() {
        await this.headerUsermenu.click();
        await this.aboutLink.click();
    }

    async expectAboutVisible() {
        await expect(this.aboutModal).toBeVisible();
        await expect(this.aboutModal).toContainText('About');
    }

    async closeAbout() {
        await this.aboutModalCloseButton.click();
    }

    async goToSupport() {
        await this.headerUsermenu.click();
        await this.supportLink.click();
    }

    async goToChangePassword() {
        await this.headerUsermenu.click();
        await this.changePasswordLink.click();
    }

    async logout() {
        await this.headerUsermenu.click();
        await this.logoutLink.click();
    }
}