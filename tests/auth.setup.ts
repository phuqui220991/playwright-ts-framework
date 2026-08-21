import { test as setup } from '@fixtures/pom.fixture';
import { env } from '@utils/env';

setup('authenticate', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(env.username, env.password);
    await page.waitForURL(/\/dashboard\/index/);
    await page.context().storageState({ path: 'auth/storageState/auth.json' });
});
