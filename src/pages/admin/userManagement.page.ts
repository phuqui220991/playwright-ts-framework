import { expect, Locator, Page } from '@playwright/test';
import { UIUserFormData } from '../../models/user';
import { BasePage } from '@pages/base.page';
import { Routes } from '../../constants/routes';

export class UserManagementPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly employeeNameInput: Locator;
    readonly roleDropdown: Locator;
    readonly statusDropdown: Locator;
    readonly saveButton: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);
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

    async open(action: string): Promise<void> {
        if (action === 'add') {
            await this.goto(Routes.addSystemUser);
        } else {
            await this.goto(Routes.viewSystemUsers);
        }
    }

    async selectDropdownOption(dropdown: Locator, optionLabel: string): Promise<void> {
        await dropdown.click();
        await this.page.getByRole('option', { name: optionLabel, exact: true }).click();
    }

    async selectEmployee(name: string): Promise<void> {
        await this.employeeNameInput.fill(name);
        await this.page.getByRole('option', { name, exact: true }).click();
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

    async expectSuccessMessage(): Promise<void> {
        await expect(this.successMessage).toBeVisible();
    }

    async searchByUsername(username: string): Promise<void> {
        await this.page.goto(Routes.viewSystemUsers);
        await this.page
            .locator('div.oxd-input-group', { hasText: 'Username' })
            .locator('input')
            .fill(username);
        await this.page.getByRole('button', { name: 'Search' }).click();
    }

    userRow(username: string): Locator {
        return this.page.getByRole('row').filter({ hasText: username });
    }

    async expectUserVisible(username: string): Promise<void> {
        await expect(this.userRow(username)).toBeVisible();
    }
}
