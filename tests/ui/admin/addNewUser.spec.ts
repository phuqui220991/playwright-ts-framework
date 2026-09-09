import { UserBuilder } from '@data/builders/userBuilder';
import { test } from '@fixtures/merged.fixture';

test.describe('User Management validation', () => {
    test('TC-AddNewUser-001: Add new user successfully', async ({
        userManagementPage,
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForUi();

        await userManagementPage.open('add');
        await userManagementPage.createUser(user);
        await userManagementPage.expectSuccessMessage();
        await userManagementPage.searchByUsername(user.username);
        await userManagementPage.expectUserVisible(user.username);

        // Created through the UI, so it isn't tracked by usersApi.create() — clean it up explicitly.
        await usersApi.deleteByUsername(user.username);
    });

    test('TC-AddNewUser-002: a user seeded via the API is visible in the user list', async ({
        userManagementPage,
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        await userManagementPage.searchByUsername(user.username);
        await userManagementPage.expectUserVisible(user.username);
    });
});
