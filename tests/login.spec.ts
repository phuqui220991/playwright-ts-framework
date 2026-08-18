import { test, expect } from '@fixtures/pom.fixture';
import { env } from '@utils/env'

test.describe('Authentication', () => {

  test('TC-Login-001: Login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {
    await loginPage.open();
    await loginPage.login(env.username ?? 'orangehrm', env.password ?? 'Admin@0123');
    await dashboardPage.expectLoaded();
  });

  test('TC-Login-002: Show an error with invalid credentials', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('invalidUsername', 'invalidPassword');
    await loginPage.expectInvalidCredentialsError();
  });

});
