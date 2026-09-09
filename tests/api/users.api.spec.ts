import { request } from '@playwright/test';
import { test, expect } from '@fixtures/api.fixture';
import { UserBuilder } from '@data/builders/userBuilder';
import { Endpoints } from '@constants/endpoints';
import { env } from '@utils/env';

test.describe('Users API', () => {
    test('creates a user and it becomes searchable by username', async ({ usersApi }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();

        const created = await usersApi.create(user);
        expect(created.userName).toBe(user.username);
        expect(created.status).toBe(true);
        expect(created.userRole.name).toBe('Admin');

        const found = await usersApi.findByUsername(user.username);
        expect(found?.id).toBe(created.id);
    });

    test('rejects a duplicate username with 422', async ({ usersApi }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        const response = await usersApi.createRaw(user);

        expect(response.status()).toBe(422);
        const body = await response.json();
        expect(body.error.data.invalidParamKeys).toContain('username');
    });

    test('rejects a create request missing empNumber with 422', async ({ apiClient }) => {
        const response = await apiClient.post(Endpoints.users.base, {
            data: {
                username: `no_emp_${Date.now()}`,
                password: 'Admin@0123',
                status: true,
                userRoleId: 1,
            },
        });

        expect(response.status()).toBe(422);
        const body = await response.json();
        expect(body.error.data.invalidParamKeys).toContain('empNumber');
    });

    test('returns no result when searching for a username that does not exist', async ({
        usersApi,
    }) => {
        const found = await usersApi.findByUsername(`nonexistent_${Date.now()}`);
        expect(found).toBeUndefined();
    });

    test('deletes a user by username', async ({ usersApi }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        await usersApi.deleteByUsername(user.username);

        const found = await usersApi.findByUsername(user.username);
        expect(found).toBeUndefined();
    });

    test('returns 404 when deleting an id that does not exist', async ({ usersApi }) => {
        const response = await usersApi.deleteRaw([999999999]);
        expect(response.status()).toBe(404);
    });

    test('rejects unauthenticated requests with 401', async () => {
        // The project's storageState (an authenticated session) is the request fixture's default,
        // so it must be overridden here to get a truly logged-out context.
        const anonymous = await request.newContext({
            baseURL: env.baseUrl,
            storageState: { cookies: [], origins: [] },
        });

        const response = await anonymous.get(Endpoints.users.base);
        expect(response.status()).toBe(401);

        await anonymous.dispose();
    });
});
