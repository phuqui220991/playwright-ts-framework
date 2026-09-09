import { expect, test as setup } from '@fixtures/pom.fixture';
import { env } from '@utils/env';

setup('authenticate', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(env.username, env.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
    await page.context().storageState({ path: 'auth/storageState/auth.json' });
});
