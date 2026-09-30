import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Logger } from '@utils/log/logger';
import { env } from '@utils/env';

type GetOptions = Parameters<APIRequestContext['get']>[1];
type PostOptions = Parameters<APIRequestContext['post']>[1];
type PutOptions = Parameters<APIRequestContext['put']>[1];
type DeleteOptions = Parameters<APIRequestContext['delete']>[1];

export class ApiClient {
    constructor(private readonly request: APIRequestContext) {}

    async get(path: string, options?: GetOptions): Promise<APIResponse> {
        Logger.info(`API GET: ${path}`);
        const response = await this.request.get(path, options);
        await this.logResponse('GET', path, response);
        return response;
    }

    async post(path: string, options?: PostOptions): Promise<APIResponse> {
        Logger.info(`API POST: ${path}`);
        const response = await this.request.post(path, options);
        await this.logResponse('POST', path, response);
        return response;
    }

    async put(path: string, options?: PutOptions): Promise<APIResponse> {
        Logger.info(`API PUT: ${path}`);
        const response = await this.request.put(path, options);
        await this.logResponse('PUT', path, response);
        return response;
    }

    async delete(path: string, options?: DeleteOptions): Promise<APIResponse> {
        Logger.info(`API DELETE: ${path}`);
        const response = await this.request.delete(path, options);
        await this.logResponse('DELETE', path, response);
        return response;
    }

    private async logResponse(method: string, path: string, response: APIResponse): Promise<void> {
        Logger.info(`API ${method} ${path} -> ${response.status()}`);
        if (env.debug) {
            const body = await response.text().catch(() => '');
            Logger.debug(`API ${method} ${path} body: ${body.slice(0, 1000)}`);
        }
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
