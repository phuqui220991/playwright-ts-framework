import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { Routes } from '@constants/routes';

export class LoginPage extends BasePage {
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly errorAlert: Locator;

    constructor(page: Page) {
        super(page);

        this.usernameInput = page.getByPlaceholder('Username');
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.errorAlert = page.locator('.oxd-alert-content-text');
    }

    async open(): Promise<void> {
        await this.goto(Routes.login);
    }

    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async expectInvalidCredentialsError(): Promise<void> {
        await expect(this.errorAlert).toHaveText('Invalid credentials');
    }

    async expectLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(/\/auth\/login/);
        await expect(this.loginButton).toBeVisible();
    }
}
