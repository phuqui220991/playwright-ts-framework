import { EnvConfig } from './env.types';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

const environment = process.env.ENV || 'example';
const envFile = path.resolve(process.cwd(), `.env.${environment}`);

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else if (!process.env.CI) {
    throw new Error(`Environment file not found: ${envFile}`);
}

const envSchema = z.object({
    BASE_URL: z.string().min(1).startsWith('http'),
    TEST_USERNAME: z.string().min(1),
    TEST_PASSWORD: z.string().min(1),

    // Falls back to BASE_URL below when absent.
    API_BASE_URL: z.string().min(1).startsWith('http').optional(),

    // Deliberately NOT z.coerce.boolean(): coercion follows JS truthiness,
    // so the string "false" would become true.
    DEBUG: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const details = parsed.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
    throw new Error(
        `Invalid environment configuration for ENV=${environment}\n` +
            `Checked: ${envFile}\n${details}`,
    );
}

export const env: EnvConfig = {
    baseUrl: parsed.data.BASE_URL,
    apiBaseUrl: parsed.data.API_BASE_URL ?? parsed.data.BASE_URL,
    username: parsed.data.TEST_USERNAME,
    password: parsed.data.TEST_PASSWORD,
    environmentName: environment,
    debug: parsed.data.DEBUG,
};
