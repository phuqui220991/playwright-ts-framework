import { test as base, expect } from '@playwright/test';
import { ApiClient } from '@api/clients/api.client';
import { UsersApi } from '@api/services/users.api';

type ApiFixtures = {
    apiClient: ApiClient;
    usersApi: UsersApi;
};

export const test = base.extend<ApiFixtures>({
    apiClient: async ({ request }, use) => {
        await use(new ApiClient(request));
    },

    usersApi: async ({ apiClient }, use) => {
        const usersApi = new UsersApi(apiClient);
        await use(usersApi);
        await usersApi.cleanupCreated();
    },
});

export { expect };
