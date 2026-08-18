const REQUIRED_ENV_VARS = ['BASE_URL', 'TEST_USERNAME', 'TEST_PASSWORD'];

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}