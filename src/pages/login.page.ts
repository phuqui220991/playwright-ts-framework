import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorAlert: Locator;
    
    constructor(page: Page) {
        super(page)
        this.usernameInput = page.getByPlaceholder("Username");
        this.passwordInput = page.getByPlaceholder("Password");
        this.loginButton = page.getByRole("button", { name: "Login"});
        this.errorAlert = page.locator('.oxd-alert-content-text');
    }

    async open() {
        await this.goto('/web/index.php/auth/login');
    }
 
    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
 
    async expectInvalidCredentialsError() {
        await expect(this.errorAlert).toHaveText("Invalid credentials")
    }
}