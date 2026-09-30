import { UserBuilder } from '@data/builders/user.builder';
import { test } from '@fixtures/merged.fixture';

test.describe('User Management', () => {
    test('TC-UserManagement-001: Add new user successfully', async ({
        addSystemUserPage,
        systemUsersPage,
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForUi();
        // Created through the UI, so usersApi.create() doesn't track it — register it for teardown.
        usersApi.trackForCleanup(user.username);

        await addSystemUserPage.open();
        await addSystemUserPage.expectLoaded();
        await addSystemUserPage.createUser(user);
        await addSystemUserPage.expectSuccessMessage();

        await systemUsersPage.open();
        await systemUsersPage.expectLoaded();
        await systemUsersPage.searchByUsername(user.username);
        await systemUsersPage.expectUserVisible(user.username);
    });

    test('TC-UserManagement-002: A user seeded via the API is visible in the user list', async ({
        systemUsersPage,
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        await systemUsersPage.open();
        await systemUsersPage.expectLoaded();
        await systemUsersPage.searchByUsername(user.username);
        await systemUsersPage.expectUserVisible(user.username);
    });
});
