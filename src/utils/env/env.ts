import { EnvConfig } from './env.types';
import { validateEnv } from './env.validation';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const environment = process.env.ENV || 'example';
const envFile = path.resolve(process.cwd(), `.env.${environment}`);

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else if (!process.env.CI) {
    throw new Error(`Environment file not found: ${envFile}`);
}

validateEnv();

export const env: EnvConfig = {
    baseUrl: process.env.BASE_URL!,
    username: process.env.TEST_USERNAME!,
    password: process.env.TEST_PASSWORD!,
    apiBaseUrl: process.env.API_BASE_URL || '',
    environmentName: environment,
};
