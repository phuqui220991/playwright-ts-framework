import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Logger } from '@utils/log/logger';

type GetOptions = Parameters<APIRequestContext['get']>[1];
type PostOptions = Parameters<APIRequestContext['post']>[1];
type PutOptions = Parameters<APIRequestContext['put']>[1];
type DeleteOptions = Parameters<APIRequestContext['delete']>[1];

export class ApiClient {
    constructor(private readonly request: APIRequestContext) {}

    async get(path: string, options?: GetOptions): Promise<APIResponse> {
        Logger.info(`API GET: ${path}`);
        const response = await this.request.get(path, options);
        Logger.info(`API GET ${path} -> ${response.status()}`);
        return response;
    }

    async post(path: string, options?: PostOptions): Promise<APIResponse> {
        Logger.info(`API POST: ${path}`);
        const response = await this.request.post(path, options);
        Logger.info(`API POST ${path} -> ${response.status()}`);
        return response;
    }

    async put(path: string, options?: PutOptions): Promise<APIResponse> {
        Logger.info(`API PUT: ${path}`);
        const response = await this.request.put(path, options);
        Logger.info(`API PUT ${path} -> ${response.status()}`);
        return response;
    }

    async delete(path: string, options?: DeleteOptions): Promise<APIResponse> {
        Logger.info(`API DELETE: ${path}`);
        const response = await this.request.delete(path, options);
        Logger.info(`API DELETE ${path} -> ${response.status()}`);
        return response;
    }

    async expectStatus(response: APIResponse, expectedStatus: number): Promise<void> {
        const responseText = await response.text().catch(() => '');

        expect(
            response.status(),
            `Expected status ${expectedStatus}, but received ${response.status()}.
URL: ${response.url()}
Body: ${responseText.slice(0, 1000)}`,
        ).toBe(expectedStatus);
    }

    async expectOk(response: APIResponse): Promise<void> {
        const responseText = await response.text().catch(() => '');

        expect(
            response.ok(),
            `Expected response to be OK.
Status: ${response.status()}
URL: ${response.url()}
Body: ${responseText.slice(0, 1000)}`,
        ).toBeTruthy();
    }

    async json<T>(response: APIResponse): Promise<T> {
        return (await response.json()) as T;
    }
}
