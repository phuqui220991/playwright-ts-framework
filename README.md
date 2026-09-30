# playwright-ts-framework

Playwright + TypeScript UI and API tests for OrangeHRM.

## Quick start

```bash
nvm use
npm ci
npx playwright install --with-deps
docker compose up -d && docker/install-orangehrm.sh   # local OrangeHRM on :8080
npx playwright test --project=chromium                # UI tests, one browser
npx playwright test --project=api                     # API tests
```

- Conventions for writing tests (page objects, fixtures, locators, data, auth, commands): [CLAUDE.md](CLAUDE.md)
- Local/CI OrangeHRM stack: [docker/README.md](docker/README.md)
