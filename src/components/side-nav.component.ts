import { Page } from '@playwright/test';
import { Logger } from '@utils/log/logger';

export class SideNavComponent {
    constructor(private readonly page: Page) {}

    private menuItem(menuName: string) {
        return this.page.getByRole('link', {
            name: new RegExp(menuName, 'i'),
        });
    }

    async openMenu(menuName: string): Promise<void> {
        Logger.info(`Opening side navigation menu: ${menuName}`);
        await this.menuItem(menuName).click();
    }
}
