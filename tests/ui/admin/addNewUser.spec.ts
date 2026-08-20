import { UserBuilder } from '@data/builders/userBuilder';
import { test } from '@fixtures/pom.fixture';

test.describe('User Management validation', () => {
  test('TC-AddNewUser-001: Add new user successfully', async ({ userManagementPage }) => {
    const user = new UserBuilder().asAdmin().enabledUser().buildForUi();
    
    await userManagementPage.open('add');
    await userManagementPage.createUser(user);
    await userManagementPage.expectSuccessMessage();
    await userManagementPage.searchByUsername(user.username);
    await userManagementPage.expectUserVisible(user.username);
  });
});