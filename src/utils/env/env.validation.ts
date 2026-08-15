export function validateEnv(): void {
  const requiredEnvVars = ['BASE_URL'];
  
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}