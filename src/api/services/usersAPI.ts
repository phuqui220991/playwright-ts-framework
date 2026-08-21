import { APIRequestContext, APIResponse } from '@playwright/test';
import { APIUserData } from '../../models/user';

export class UsersApi {
    constructor(private request: APIRequestContext) {}

    async createUser(user: APIUserData): Promise<APIResponse> {
        return this.request.post('/api/users', {
            data: user,
        });
    }

    async getUserByUsername(username: string): Promise<APIResponse> {
        return this.request.get(`/api/users?username=${username}`);
    }
}
