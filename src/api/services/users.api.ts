import { APIResponse } from '@playwright/test';
import { ApiClient } from '@api/clients/api.client';
import { Endpoints } from '@constants/endpoints';
import {
    AdminUserListResponse,
    AdminUserRecord,
    AdminUserResponse,
    APIUserData,
} from '../../models/user';

const SEARCH_DEFAULTS = { limit: 50, offset: 0, sortField: 'u.userName', sortOrder: 'ASC' };

export class UsersApi {
    private readonly createdUsernames = new Set<string>();

    constructor(private readonly client: ApiClient) {}

    createRaw(user: APIUserData): Promise<APIResponse> {
        return this.client.post(Endpoints.users.base, { data: user });
    }

    searchRaw(username: string): Promise<APIResponse> {
        return this.client.get(Endpoints.users.base, {
            params: { ...SEARCH_DEFAULTS, username },
        });
    }

    deleteRaw(ids: number[]): Promise<APIResponse> {
        return this.client.delete(Endpoints.users.base, { data: { ids } });
    }

    /** Creates a user via the API and tracks it for automatic cleanup. */
    async create(user: APIUserData): Promise<AdminUserRecord> {
        const response = await this.createRaw(user);
        await this.client.expectOk(response);
        const body = await this.client.json<AdminUserResponse>(response);
        this.createdUsernames.add(user.username);
        return body.data;
    }

    async findByUsername(username: string): Promise<AdminUserRecord | undefined> {
        const response = await this.searchRaw(username);
        await this.client.expectOk(response);
        const body = await this.client.json<AdminUserListResponse>(response);
        return body.data.find((record) => record.userName === username);
    }

    async deleteByUsername(username: string): Promise<void> {
        const user = await this.findByUsername(username);
        if (user) {
            const response = await this.deleteRaw([user.id]);
            await this.client.expectOk(response);
        }
        this.createdUsernames.delete(username);
    }

    /** Deletes every user created via {@link create} during the current test. */
    async cleanupCreated(): Promise<void> {
        for (const username of [...this.createdUsernames]) {
            await this.deleteByUsername(username);
        }
    }
}
