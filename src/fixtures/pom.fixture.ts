import { test as base } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { DashboardPage } from "@pages/dashboard.page";
import { ChangePasswordPage } from "@pages/changePassword.page";
import { SupportPage } from "@pages/support.page";

type Pages = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    changePasswordPage: ChangePasswordPage;
    supportPage: SupportPage;
}

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  changePasswordPage: async ({ page }, use) => {
    await use(new ChangePasswordPage(page));
  },

  supportPage: async ({ page }, use) => {
    await use(new SupportPage(page));
  },
});

export { expect } from '@playwright/test';