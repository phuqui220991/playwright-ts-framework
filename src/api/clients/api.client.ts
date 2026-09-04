import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test } from '@playwright/test';
import type { ZodType } from 'zod';

type RequestOptions<M extends 'get' | 'post' | 'put' | 'patch' | 'delete'> = Parameters<
    APIRequestContext[M]
>[1];

export type ApiResult<T = unknown> = {
    status: number;
    ok: boolean;
    headers: Record<string, string>;
    body: T;
    raw: APIResponse;
};

export class ApiClient {
    constructor(
        protected readonly request: APIRequestContext,
        protected readonly defaults: { baseUrl?: string; token?: string } = {},
    ) {}

    get<T>(endpoint: string, options?: RequestOptions<'get'>) {
        return this.send<T>('get', endpoint, options);
    }

    post<T, TBody = unknown>(endpoint: string, data?: TBody, options?: RequestOptions<'post'>) {
        return this.send<T>('post', endpoint, { ...options, data });
    }

    put<T, TBody = unknown>(endpoint: string, data?: TBody, options?: RequestOptions<'put'>) {
        return this.send<T>('put', endpoint, { ...options, data });
    }

    patch<T, TBody = unknown>(endpoint: string, data?: TBody, options?: RequestOptions<'patch'>) {
        return this.send<T>('patch', endpoint, { ...options, data });
    }

    delete<T>(endpoint: string, data?: unknown, options?: RequestOptions<'delete'>) {
        return this.send<T>('delete', endpoint, { ...options, data });
    }

    /**
     * Same as the verb methods, but throws a rich error on non-2xx.
     * Use this in fixtures / arrange steps where a failure is not the thing under test.
     */
    async ensureOk<T>(result: Promise<ApiResult<T>>): Promise<T> {
        const res = await result;
        if (res.ok) return res.body;

        throw new Error(
            [
                'API request failed.',
                `Status: ${res.status} ${res.raw.statusText()}`,
                `URL: ${res.raw.url()}`,
                `Body: ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2)}`,
            ].join('\n'),
        );
    }

    /** Runtime contract check. Fails loudly with the exact path that drifted. */
    parse<T>(schema: ZodType<T>, result: ApiResult<unknown>): T {
        const parsed = schema.safeParse(result.body);
        if (!parsed.success) {
            throw new Error(
                [
                    `Response schema mismatch for ${result.raw.url()}`,
                    `Status: ${result.status}`,
                    parsed.error.issues
                        .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
                        .join('\n'),
                ].join('\n'),
            );
        }
        return parsed.data;
    }

    protected async send<T>(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        endpoint: string,
        options: Record<string, unknown> = {},
    ): Promise<ApiResult<T>> {
        const url = this.resolveUrl(endpoint);

        return test.step(`${method.toUpperCase()} ${url}`, async () => {
            const response = await this.request[method](url, {
                ...options,
                headers: { ...this.authHeader(), ...(options.headers as object) },
                // never let Playwright throw for us; the caller decides
                failOnStatusCode: false,
            } as never);

            return {
                status: response.status(),
                ok: response.ok(),
                headers: response.headers(),
                body: (await this.parseBody(response)) as T,
                raw: response,
            };
        });
    }

    private authHeader(): Record<string, string> {
        return this.defaults.token ? { Authorization: `Bearer ${this.defaults.token}` } : {};
    }

    private resolveUrl(endpoint: string): string {
        const base = this.defaults.baseUrl;
        if (!base || /^https?:\/\//i.test(endpoint)) return endpoint;
        return `${base.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
    }

    /** Content-type aware, and safe on 204 / empty bodies. */
    private async parseBody(response: APIResponse): Promise<unknown> {
        if (response.status() === 204) return null;

        const contentType = response.headers()['content-type'] ?? '';
        const text = await response.text();
        if (text.length === 0) return null;

        if (contentType.includes('json')) {
            try {
                return JSON.parse(text);
            } catch {
                // Malformed JSON is a real failure — surface the payload, don't null it out.
                throw new Error(
                    `Expected JSON from ${response.url()} but parsing failed.\nRaw body: ${text.slice(0, 1000)}`,
                );
            }
        }
        return text;
    }
}
