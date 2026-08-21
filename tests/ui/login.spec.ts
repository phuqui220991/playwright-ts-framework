import { test } from '@fixtures/pom.fixture';
import { env } from '@utils/env';

test.describe('Authentication', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC-Login-001: Login successfully with valid credentials', async ({
        loginPage,
        dashboardPage,
    }) => {
        await loginPage.open();
        await loginPage.login(env.username, env.password);
        await dashboardPage.expectLoaded();
    });

    test('TC-Login-002: Show an error with invalid credentials', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.login('invalidUsername', 'invalidPassword');
        await loginPage.expectInvalidCredentialsError();
    });
});
