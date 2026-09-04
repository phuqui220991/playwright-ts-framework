import { expect, Locator, Page } from '@playwright/test';

export class HeaderComponent {
    private readonly headerUsermenu: Locator;
    private readonly aboutLink: Locator;
    private readonly supportLink: Locator;
    private readonly changePasswordLink: Locator;
    private readonly logoutLink: Locator;
    private readonly aboutModal: Locator;
    private readonly aboutModalCloseButton: Locator;

    constructor(private readonly page: Page) {
        this.headerUsermenu = page.locator('.oxd-userdropdown-tab');
        this.aboutLink = page.getByRole('menuitem', { name: 'About' });
        this.supportLink = page.getByRole('menuitem', { name: 'Support' });
        this.changePasswordLink = page.getByRole('menuitem', { name: 'Change Password' });
        this.logoutLink = page.getByRole('menuitem', { name: 'Logout' });
        this.aboutModal = page.locator('.oxd-dialog-container-default');
        this.aboutModalCloseButton = this.aboutModal.locator('.oxd-dialog-close-button');
    }

    async openAbout(): Promise<void> {
        await this.headerUsermenu.click();
        await this.aboutLink.click();
    }

    async expectAboutVisible(): Promise<void> {
        await expect(this.aboutModal).toBeVisible();
        await expect(this.aboutModal).toContainText('About');
    }

    async closeAbout(): Promise<void> {
        await this.aboutModalCloseButton.click();
    }

    async goToSupport(): Promise<void> {
        await this.headerUsermenu.click();
        await this.supportLink.click();
    }

    async goToChangePassword(): Promise<void> {
        await this.headerUsermenu.click();
        await this.changePasswordLink.click();
    }

    async logout(): Promise<void> {
        await this.headerUsermenu.click();
        await this.logoutLink.click();
    }
}
