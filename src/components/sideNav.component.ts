import { Locator, Page } from '@playwright/test';

export class SideNavComponent {
    constructor(private readonly page: Page) {}

    private menuItem(menuName: string): Locator {
        return this.page.getByRole('link', {
            name: new RegExp(menuName, 'i'),
        });
    }

    async openMenu(menuName: string): Promise<void> {
        await this.menuItem(menuName).click();
    }
}
