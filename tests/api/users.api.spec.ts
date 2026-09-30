import { request } from '@playwright/test';
import { test, expect } from '@fixtures/api.fixture';
import { ApiClient } from '@api/clients/api.client';
import { UserBuilder } from '@data/builders/user.builder';
import { ApiErrorResponse } from '@models/api';
import { Endpoints } from '@constants/endpoints';
import { Roles } from '@constants/roles';
import { env } from '@utils/env';

test.describe('Users API', () => {
    test('TC-UsersApi-001: Creates a user and it becomes searchable by username', async ({
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();

        const created = await usersApi.create(user);
        expect(created.userName).toBe(user.username);
        expect(created.status).toBe(true);
        expect(created.userRole.name).toBe(Roles.admin.label);

        const found = await usersApi.findByUsername(user.username);
        expect(found?.id).toBe(created.id);
    });

    test('TC-UsersApi-002: Rejects a duplicate username with 422', async ({
        apiClient,
        usersApi,
    }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        const response = await usersApi.createRaw(user);

        await apiClient.expectStatus(response, 422);
        const body = await apiClient.json<ApiErrorResponse>(response);
        expect(body.error.data?.invalidParamKeys).toContain('username');
    });

    test('TC-UsersApi-003: Rejects a create request missing empNumber with 422', async ({
        apiClient,
    }) => {
        const { empNumber, ...userWithoutEmpNumber } = new UserBuilder()
            .asAdmin()
            .enabledUser()
            .buildForApi();

        const response = await apiClient.post(Endpoints.users.base, {
            data: userWithoutEmpNumber,
        });

        await apiClient.expectStatus(response, 422);
        const body = await apiClient.json<ApiErrorResponse>(response);
        expect(body.error.data?.invalidParamKeys).toContain('empNumber');
    });

    test('TC-UsersApi-004: Returns no result when searching for a username that does not exist', async ({
        usersApi,
    }) => {
        const found = await usersApi.findByUsername(`nonexistent_${Date.now()}`);
        expect(found).toBeUndefined();
    });

    test('TC-UsersApi-005: Deletes a user by username', async ({ usersApi }) => {
        const user = new UserBuilder().asAdmin().enabledUser().buildForApi();
        await usersApi.create(user);

        await usersApi.deleteByUsername(user.username);

        const found = await usersApi.findByUsername(user.username);
        expect(found).toBeUndefined();
    });

    test('TC-UsersApi-006: Returns 404 when deleting an id that does not exist', async ({
        apiClient,
        usersApi,
    }) => {
        const response = await usersApi.deleteRaw([999999999]);
        await apiClient.expectStatus(response, 404);
    });

    test('TC-UsersApi-007: Rejects unauthenticated requests with 401', async () => {
        // The project's storageState (an authenticated session) is the request fixture's default,
        // so it must be overridden here to get a truly logged-out context.
        const anonymous = await request.newContext({
            baseURL: env.apiBaseUrl,
            storageState: { cookies: [], origins: [] },
        });
        const anonymousClient = new ApiClient(anonymous);

        try {
            const response = await anonymousClient.get(Endpoints.users.base);
            await anonymousClient.expectStatus(response, 401);
        } finally {
            await anonymous.dispose();
        }
    });
});
