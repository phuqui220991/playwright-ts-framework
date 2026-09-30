import { expect, Locator, Page } from '@playwright/test';
import { UIUserFormData } from '@models/user';
import { BasePage } from '@pages/base.page';
import { Routes } from '@constants/routes';

export class AddSystemUserPage extends BasePage {
    private readonly heading: Locator;
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly confirmPasswordInput: Locator;
    private readonly employeeNameInput: Locator;
    private readonly roleDropdown: Locator;
    private readonly statusDropdown: Locator;
    private readonly saveButton: Locator;
    private readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Add User' });
        this.usernameInput = page
            .locator('div.oxd-input-group', { hasText: 'Username' })
            .locator('input');
        this.passwordInput = page
            .locator('div.oxd-input-group')
            .filter({ has: page.locator('label', { hasText: /^Password$/ }) })
            .locator('input');
        this.confirmPasswordInput = page
            .locator('div.oxd-input-group', { hasText: 'Confirm Password' })
            .locator('input');
        this.employeeNameInput = page.getByPlaceholder('Type for hints...');
        this.roleDropdown = page
            .locator('div.oxd-input-group', { hasText: 'User Role' })
            .locator('.oxd-select-text');
        this.statusDropdown = page
            .locator('div.oxd-input-group', { hasText: 'Status' })
            .locator('.oxd-select-text');
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.successMessage = page.locator('.oxd-toast-content');
    }

    async open(): Promise<void> {
        await this.goto(Routes.addSystemUser);
    }

    private option(label: string): Locator {
        return this.page.getByRole('option', { name: label, exact: true });
    }

    private async selectDropdownOption(dropdown: Locator, optionLabel: string): Promise<void> {
        await dropdown.click();
        await this.option(optionLabel).click();
    }

    async selectEmployee(name: string): Promise<void> {
        await this.employeeNameInput.fill(name);
        await this.option(name).click();
    }

    async createUser(user: UIUserFormData): Promise<void> {
        await this.selectDropdownOption(this.roleDropdown, user.role);
        await this.selectDropdownOption(this.statusDropdown, user.status);
        await this.selectEmployee(user.name);
        await this.usernameInput.fill(user.username);
        await this.passwordInput.fill(user.password);
        await this.confirmPasswordInput.fill(user.confirmPassword);
        await this.saveButton.click();
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.addSystemUser);
        await expect(this.heading).toBeVisible();
    }

    async expectSuccessMessage(): Promise<void> {
        await expect(this.successMessage).toBeVisible();
    }
}
