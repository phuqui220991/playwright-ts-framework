import { test as base } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { DashboardPage } from "@pages/dashboard.page";
import { ChangePasswordPage } from "@pages/header/changePassword.page";
import { SupportPage } from "@pages/header/support.page";
import { UserManagementPage } from "@pages/admin/userManagement.page";

type Pages = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    changePasswordPage: ChangePasswordPage;
    supportPage: SupportPage;

    // Admin pages
    userManagementPage: UserManagementPage;
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

  userManagementPage: async ({ page }, use) => {
    await use(new UserManagementPage(page));
  },
});

export { expect } from '@playwright/test';