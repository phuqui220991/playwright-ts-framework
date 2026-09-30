import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { DashboardPage } from '@pages/dashboard.page';
import { ChangePasswordPage } from '@pages/header/changePassword.page';
import { SupportPage } from '@pages/header/support.page';
import { AddSystemUserPage } from '@pages/admin/addSystemUser.page';
import { SystemUsersPage } from '@pages/admin/systemUsers.page';

type Pages = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    changePasswordPage: ChangePasswordPage;
    supportPage: SupportPage;

    // Admin pages
    addSystemUserPage: AddSystemUserPage;
    systemUsersPage: SystemUsersPage;
    // Add more admin pages here as needed
};

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

    addSystemUserPage: async ({ page }, use) => {
        await use(new AddSystemUserPage(page));
    },

    systemUsersPage: async ({ page }, use) => {
        await use(new SystemUsersPage(page));
    },
});

export { expect } from '@playwright/test';
