import { mergeTests } from '@playwright/test';
import { test as pomTest } from '@fixtures/pom.fixture';
import { test as apiTest } from '@fixtures/api.fixture';

export const test = mergeTests(pomTest, apiTest);

export { expect } from '@playwright/test';
