import { EnvConfig } from "./env.types";
import { validateEnv } from "./env.validation";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const environment = process.env.ENV || 'play';
const envFile = path.resolve(process.cwd(), `.env.${environment}`);

if (!fs.existsSync(envFile)) {
  throw new Error(`Environment file not found: ${envFile}`);
}

dotenv.config({ path: envFile });

validateEnv();

export const env: EnvConfig = {
  baseUrl: process.env.BASE_URL || '',
  username: process.env.TEST_USERNAME || '',
  password: process.env.TEST_PASSWORD || '',
  apiBaseUrl: process.env.API_BASE_URL || '',
  environmentName: environment,
};