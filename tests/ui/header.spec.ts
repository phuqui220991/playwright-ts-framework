import { test } from '@fixtures/pom.fixture';
import { env } from '@utils/env';

test.describe('Header verification', () => {

  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.open();
    await dashboardPage.expectLoaded();
  });

  test('TC-Header-001: Show About popup', async ({ dashboardPage }) => {
    await dashboardPage.header.openAbout();
    await dashboardPage.header.expectAboutVisible();
  });

  test('TC-Header-002: Navigate to Support page', async ({ dashboardPage, supportPage }) => {
    await dashboardPage.header.goToSupport();
    await supportPage.expectLoaded();
  });

  test('TC-Header-003: Navigate to change password page', async ({ dashboardPage, changePasswordPage }) => {
    await dashboardPage.header.goToChangePassword();
    await changePasswordPage.expectLoaded();
  });
});

test.describe('Header verification - logout', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC-Header-004: Logout successfully', async ({ loginPage, dashboardPage }) => {
    await loginPage.open();
    await loginPage.login(env.username, env.password);
    await dashboardPage.expectLoaded();

    await dashboardPage.header.logout();
    await loginPage.expectLoaded();
  });
});