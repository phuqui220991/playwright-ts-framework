import { test, expect } from '@playwright/test';
import { env } from '@utils/env'

test('Get Environment variables', async ({ page }) => {
  await page.goto(`${env.baseUrl}/`)
  console.log(`Show env variable: ${env.baseUrl}/`)
});
