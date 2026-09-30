# CLAUDE.md

Playwright + TypeScript end-to-end suite for **OrangeHRM** (UI + REST API v2). The app under test runs locally/CI from `docker-compose.yml` on `http://localhost:8080`.

This file is the convention guide: follow it and new tests will be indistinguishable from existing ones. Every rule below is what the code does today, verified by a passing full run. §13 tracks any gaps (currently none).

---

## 1. Quick start

```bash
nvm use                         # Node 22 (.nvmrc); package.json requires >=22
npm ci
npx playwright install --with-deps
docker compose up -d            # OrangeHRM + MariaDB
docker/install-orangehrm.sh     # one-time provisioning: admin orangehrm / Admin@0123, employee "Qui Ngo"
npx playwright test --project=chromium
```

A `.env.<ENV>` file is needed locally (see §8). `.env.example` is the default and already points at the docker stack.

---

## 2. Folder structure

```
playwright.config.ts          projects: setup → chromium | firefox | webkit | api
tests/
  auth.setup.ts               the only setup file; logs in, writes auth/storageState/auth.json
  ui/                         testDir of chromium/firefox/webkit projects
    login.spec.ts
    header.spec.ts
    admin/userManagement.spec.ts  subfolder mirrors src/pages/<area>/
  api/                        testDir of the api project
    users.api.spec.ts
src/
  pages/                      page objects, one per route; extend BasePage
    base.page.ts
    login.page.ts, dashboard.page.ts
    header/                   pages reached from the header user menu (changePassword, support)
    admin/                    Admin module pages (addSystemUser, systemUsers)
  components/                 page fragments (header, sideNav); composed into pages, no base class
  api/
    clients/api.client.ts     logging wrapper over APIRequestContext + status assertions
    services/<resource>.api.ts  one class per REST resource, built on ApiClient
  fixtures/
    pom.fixture.ts            page-object fixtures
    api.fixture.ts            apiClient + service fixtures (with teardown)
    merged.fixture.ts         mergeTests(pom, api)
  data/builders/              fluent test-data builders (faker)
  models/                     TS interfaces: user.ts (UI form + API payloads/responses), api.ts (error envelope)
  constants/                  Routes, Endpoints, Roles, Status, common seed values
  utils/env/                  zod-validated env loader (import from '@utils/env')
  utils/log/logger.ts         static Logger (INFO/WARN/ERROR/DEBUG)
docker/                       OrangeHRM provisioning (see docker/README.md)
auth/storageState/auth.json   generated, gitignored
```

### Path aliases (tsconfig `paths`)

`@api/*`, `@components/*`, `@constants/*`, `@data/*`, `@fixtures/*`, `@pages/*`, `@utils/*`, `@models/*` all map to `src/<name>/*`. Specs and `src/` modules import through aliases. The only relative imports are inside `src/utils/env/` (its barrel file and `env.types`).

### File naming

| Kind        | Pattern                      | Examples                                                           |
| ----------- | ---------------------------- | ------------------------------------------------------------------ |
| Page object | `<camelCase>.page.ts`        | `login.page.ts`, `addSystemUser.page.ts`, `changePassword.page.ts` |
| Component   | `<camelCase>.component.ts`   | `header.component.ts`, `sideNav.component.ts`                      |
| API service | `<resource>.api.ts`          | `users.api.ts`                                                     |
| API client  | `<name>.client.ts`           | `api.client.ts`                                                    |
| Builder     | `<camelCase>.builder.ts`     | `user.builder.ts`                                                  |
| Fixture     | `<name>.fixture.ts`          | `pom.fixture.ts`                                                   |
| Model       | `<domain>.ts`                | `user.ts`, `api.ts`                                                |
| UI spec     | `<camelCaseFeature>.spec.ts` | `login.spec.ts`, `userManagement.spec.ts`                          |
| API spec    | `<resource>.api.spec.ts`     | `users.api.spec.ts`                                                |

- All file names are camelCase.
- A spec is named after the **feature** it covers (the OrangeHRM module or page), not after a single action.
- File names are case-sensitive in CI (Ubuntu) even though macOS isn't, so the file on disk must match the import exactly. `tsc` on a Mac will **not** catch a mismatch.

---

## 3. Base classes and building blocks

### `BasePage` (`src/pages/base.page.ts`)

```ts
export abstract class BasePage {
    protected readonly page: Page;

    protected constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string): Promise<void> {
        await this.page.goto(path);
    }

    /** Asserts the current URL path is exactly the given route (pass a value from `Routes`). */
    protected async expectRoute(route: string): Promise<void> {
        await expect(this.page).toHaveURL((url) => url.pathname === route);
    }
}
```

- The constructor is **`protected`**, so every subclass **must** declare its own public `constructor(page: Page) { super(page); }`. If you leave it out, the class can't be instantiated from a fixture.
- `goto()` takes a path from `Routes`, which resolves against `baseURL`.
- `expectRoute()` asserts that the URL **path is exactly** a `Routes` value. It is the only `toHaveURL` in the codebase; page objects never write their own URL regex.

### Components (`src/components/`)

- Components are plain classes with `constructor(private readonly page: Page)` and no base class. Their locators and methods follow the same rules as page objects (§5).
- They are **composed into the page object** as public `readonly` fields and are **not** registered as fixtures:
    ```ts
    readonly header: HeaderComponent;
    readonly sideNav: SideNavComponent;
    // constructor:
    this.header = new HeaderComponent(page);
    this.sideNav = new SideNavComponent(page);
    ```
- Tests reach them through the page: `dashboardPage.header.logout()`, `dashboardPage.sideNav.openMenu('Admin')`.
- Both components currently hang off `DashboardPage` only. If a test needs one from another page, add the field to that page object the same way.

### `ApiClient` (`src/api/clients/api.client.ts`)

- `get/post/put/delete(path, options)` pass through to `APIRequestContext`. They log `API <METHOD>: <path>` before the call and `API <METHOD> <path> -> <status>` after it via `Logger.info`. With `DEBUG=true`, they also `Logger.debug` the first 1000 characters of the response body (through a private `logResponse()` helper).
- `expectOk(response)` and `expectStatus(response, code)` are assertions that put the URL and the first 1000 characters of the body in the failure message.
- `json<T>(response)` is an unchecked typed cast. Always pass a `@models` type.

### API services (`src/api/services/*.api.ts`)

Each service follows the `UsersApi` shape:

- `constructor(private readonly client: ApiClient)`.
- **`xxxRaw()` methods** return the raw `APIResponse` and do **not** assert. Use them for negative tests (422, 404).
- **High-level methods** (`create`, `findByUsername`, `deleteByUsername`) call `client.expectOk()`, parse the body into a `@models` type and return the domain object.
- **Cleanup tracking:** `create()` adds the username to a private `Set`, and `cleanupCreated()` deletes everything in it. The fixture calls `cleanupCreated()` in teardown, so a test that creates data via `usersApi.create()` needs no cleanup code.
- For data created some other way (the UI), `trackForCleanup(username)` adds the username to the same `Set`. Teardown skips usernames that were never actually created.
- A module-level `const` holds the query defaults (`SEARCH_DEFAULTS`).

### `Logger` (`src/utils/log/logger.ts`)

- It's a static class with `info`/`warn`/`error`/`debug`. `debug` prints only when `env.debug` is true.
- It's used **only by `ApiClient`**. Page objects and components don't log, because Playwright's trace already records every UI action.
- Never call `console.*` directly. `Logger` is the one sanctioned console writer and carries the only `no-console` lint exemption.

---

## 4. Fixtures and how page objects are registered

There are three fixture files, and every spec imports `test` (and `expect` if it needs it) from one of them. No spec imports `test` from `@playwright/test`.

| Import from                | Provides                                                                                                  | Used by                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `@fixtures/pom.fixture`    | `loginPage`, `dashboardPage`, `changePasswordPage`, `supportPage`, `addSystemUserPage`, `systemUsersPage` | `login.spec`, `header.spec`, `auth.setup`                       |
| `@fixtures/api.fixture`    | `apiClient`, `usersApi` (auto-cleanup)                                                                    | `users.api.spec`                                                |
| `@fixtures/merged.fixture` | everything above                                                                                          | `userManagement.spec` (UI test that seeds or cleans up via API) |

Pick the narrowest file that gives you the fixtures you need. All three re-export `expect` with `export { expect } from '@playwright/test';`.

### Adding a new page object (checklist)

1. Create `src/pages/<area>/<name>.page.ts` extending `BasePage`, with a public constructor calling `super(page)`.
    - Use **one page object per route**. If a module has a list page and a form page, those are two classes (`SystemUsersPage`, `AddSystemUserPage`).
2. Add its path to `src/constants/routes.ts`, then add:
    - an argument-less `async open(): Promise<void> { await this.goto(Routes.x); }`;
    - an `expectLoaded()` that calls `this.expectRoute(Routes.x)` and checks a landmark, which is normally `private readonly heading = page.getByRole('heading', { name: '…' })`.
3. Register it in `src/fixtures/pom.fixture.ts` in two places:
    ```ts
    type Pages = { /* ... */ fooPage: FooPage; };          // under the matching "// Admin pages" style comment
    // ...
    fooPage: async ({ page }, use) => {
        await use(new FooPage(page));
    },
    ```
    Fixture name = camelCase class name. Keep a blank line between fixture entries.
4. `merged.fixture.ts` picks it up automatically.

### Adding a new API service

1. Add the endpoint to `src/constants/endpoints.ts` (`Endpoints.<resource>.base`).
2. Add request/response interfaces to `src/models/<resource>.ts`. Error bodies use the shared `ApiErrorResponse` in `src/models/api.ts`.
3. Create `src/api/services/<resource>.api.ts` following the Raw/high-level/cleanup shape above.
4. Register it in `src/fixtures/api.fixture.ts`, using teardown for cleanup:
    ```ts
    fooApi: async ({ apiClient }, use) => {
        const fooApi = new FooApi(apiClient);
        await use(fooApi);
        await fooApi.cleanupCreated();
    },
    ```

---

## 5. How page objects are written

A representative example (`changePassword.page.ts`) looks like this:

```ts
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import { Routes } from '@constants/routes';

export class ChangePasswordPage extends BasePage {
    private readonly heading: Locator;

    constructor(page: Page) {
        super(page);

        this.heading = page.getByRole('heading', { name: 'Update Password' });
    }

    async open(): Promise<void> {
        await this.goto(Routes.changePassword);
    }

    async expectLoaded(): Promise<void> {
        await this.expectRoute(Routes.changePassword);
        await expect(this.heading).toBeVisible();
    }
}
```

Rules:

- **Locators** are declared as `private readonly x: Locator` fields and assigned in the constructor. Tests never touch locators directly; they go through action and `expectX()` methods.
- **Dynamic locators** (parameterised by data) are methods with an explicit `: Locator` return type, e.g. `userRow(username: string): Locator`, and the private `option(label)` and `menuItem(name)`.
- **Action methods** are verbs (`login`, `createUser`, `searchByUsername`, `openAbout`, `goToSupport`, `logout`, `openMenu`). They return `Promise<void>` and do not assert.
    - They also **do not navigate** to another route as a side effect; only `open()` navigates.
    - Clicking a link that leads elsewhere (`goToSupport`) is fine. The spec then calls the destination page's `expectLoaded()`.
- **Assertion methods** are named `expect<Something>()` (`expectLoaded`, `expectSuccessMessage`, `expectUserVisible`, `expectInvalidCredentialsError`, `expectAboutVisible`).
    - They live in the page object and use web-first `expect`.
    - The ESLint rule `playwright/expect-expect` is configured with `assertFunctionPatterns: ['^expect']`, so a test that only calls `pageObject.expectX()` counts as asserting.
- **`expectLoaded()`** is the standard "am I on this page" check. It calls `this.expectRoute(Routes.x)`, then asserts that a landmark element is visible. Every page object has both `open()` and `expectLoaded()`.
- **Form-filling methods** take a typed model (`createUser(user: UIUserFormData)`), not loose arguments, when there are more than about 2 fields.
- Helpers used only inside the class (`selectDropdownOption`, `option`, `menuItem`) are `private`.
- All async methods have an explicit `Promise<void>` return type.

---

## 6. Locator conventions (counted)

These counts cover the **29 locator definitions** in `src/`. Tests define none; every locator lives in a page object or component.

| Strategy                                                                            | Count  | Where / how                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getByRole(role, { name })`                                                         | **15** | `heading` ×5 (the `expectLoaded()` landmark of Dashboard, Add User, System Users, Update Password, Support), `menuitem` ×4 (header menu), buttons ×3 (Login, Save, Search), `option` ×1 (with `exact: true`), `link` ×1 (side nav, `new RegExp(name, 'i')`), `row` ×1 |
| CSS `locator()`                                                                     | **11** | all target OrangeHRM `oxd-*` classes (6 of them `div.oxd-input-group` form fields)                                                                                                                                                                                    |
| `getByPlaceholder()`                                                                | **3**  | login Username/Password, employee autocomplete `'Type for hints...'`                                                                                                                                                                                                  |
| `getByLabel` / `getByText` / `getByTestId` / XPath / `nth()` / `first()` / `last()` | **0**  | not used                                                                                                                                                                                                                                                              |

- **Modifiers:** `.filter()` ×2 (`{ has: ... }` for the Password field, `{ hasText }` for table rows), the `{ hasText }` option on `locator()` ×6, `exact: true` ×1, regex names ×2.
- **Placement:** 26 are constructor fields. The other 3 are methods returning `Locator`, because they take a parameter: `menuItem(name)`, `option(label)` and `userRow(username)`.
- The Username input-group locator appears in both `AddSystemUserPage` and `SystemUsersPage`. They're different pages, so each declares its own.

**House patterns:**

1. **Role first.** Use `getByRole` with an accessible name for buttons, links, menu items, headings, options and rows.
2. **Placeholder** for inputs that have one.
3. **OrangeHRM form fields: scope by the input-group label.** OrangeHRM `<label>`s are not associated with their inputs, so `getByLabel` does not work. The idiom is:
    ```ts
    page.locator('div.oxd-input-group', { hasText: 'User Role' }).locator('.oxd-select-text');
    page.locator('div.oxd-input-group', { hasText: 'Username' }).locator('input');
    ```
    `hasText` is a **substring** match, so when one label is contained in another (`Password` ⊂ `Confirm Password`), switch to an exact label filter:
    ```ts
    page.locator('div.oxd-input-group')
        .filter({ has: page.locator('label', { hasText: /^Password$/ }) })
        .locator('input');
    ```
4. **OrangeHRM custom dropdowns / autocompletes:** click the `.oxd-select-text` trigger, then `page.getByRole('option', { name, exact: true }).click()`. See the private `option(label)` and `selectDropdownOption(dropdown, label)` helpers in `AddSystemUserPage`.
5. **`oxd-*` CSS classes** are used only where there's no usable role or text:
    - toast (`.oxd-toast-content`)
    - alert (`.oxd-alert-content-text`)
    - user dropdown (`.oxd-userdropdown-tab`)
    - dialog (`.oxd-dialog-container-default`, `.oxd-dialog-close-button`)
6. **Containers:** chain from a parent locator for things inside a container (`this.aboutModal.locator('.oxd-dialog-close-button')`).

---

## 7. Assertions and waits

**Waits:**

- There are **no explicit waits anywhere**: zero uses of `waitForTimeout`, `waitForLoadState`, `waitForURL`, `waitForSelector`, `waitForResponse`, `expect.poll`, `toPass` or `test.slow`.
- Synchronisation relies entirely on actionability auto-waiting and web-first assertions. Keep it that way.
- A navigation is confirmed by the _next page's_ `expectLoaded()`, not by a wait.

Timeouts (from `playwright.config.ts`): test 30s, `expect` 5s, action 10s, navigation 15s.

**Matchers used** (22 total):

| Matcher         | Count | Note                                |
| --------------- | ----- | ----------------------------------- |
| `toBeVisible`   | 9     |                                     |
| `toBe`          | 5     | one inside `ApiClient.expectStatus` |
| `toContain`     | 2     |                                     |
| `toBeUndefined` | 2     |                                     |
| `toHaveURL`     | 1     | inside `BasePage.expectRoute`       |
| `toHaveText`    | 1     |                                     |
| `toContainText` | 1     |                                     |
| `toBeTruthy`    | 1     | inside `ApiClient.expectOk`         |

**Where assertions live:**

- **UI specs and `auth.setup.ts` contain no bare `expect()`.** They call page-object `expectX()` methods, and none of them import `expect`.
- **API specs** check status codes with `await apiClient.expectStatus(response, n)`, never `expect(response.status())`, so a failure shows the URL and response body. Parsed bodies are read with `apiClient.json<Model>()` and asserted inline with plain (non-web-first) `expect(value).toBe(...)`.
- **Service methods** assert success internally via `client.expectOk()`.

Negative API test pattern (destructure `apiClient` alongside `usersApi`; it's the same instance the service uses):

```ts
const response = await usersApi.createRaw(user);
await apiClient.expectStatus(response, 422);
const body = await apiClient.json<ApiErrorResponse>(response);
expect(body.error.data.invalidParamKeys).toContain('username');
```

- `ApiErrorResponse` (`src/models/api.ts`) was captured from real responses:
    - `data` is **optional**, because only validation errors (422) carry `data.invalidParamKeys`. Read it as `body.error.data?.invalidParamKeys`.
    - `status` is `string | number`: OrangeHRM sends `"422"`/`"404"` as strings but `401` as a number. Assert on the HTTP status via `expectStatus`, not on `error.status`.
- For a request made on a custom context (such as the logged-out 401 test), wrap it with `new ApiClient(context)` so the call is logged and `expectStatus` is available (see §10).

---

## 8. Environment and config

`src/utils/env/env.ts` runs when it is first imported (the config imports it):

1. `ENV` (default **`example`**) selects the file `.env.<ENV>` in the repo root.
2. If the file exists, dotenv loads it. If it's missing, the loader **throws**, unless `CI` is set, in which case it reads straight from `process.env`.
3. zod validates the result:

| Var             | Rule                               | Exposed as                                                           |
| --------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `BASE_URL`      | required, starts with `http`       | `env.baseUrl` (`use.baseURL` for setup + browser projects)           |
| `TEST_USERNAME` | required                           | `env.username`                                                       |
| `TEST_PASSWORD` | required                           | `env.password`                                                       |
| `API_BASE_URL`  | optional, falls back to `BASE_URL` | `env.apiBaseUrl` (`use.baseURL` for the `api` project)               |
| `DEBUG`         | optional, `'true'`/`'false'` only  | `env.debug`: turns on `Logger.debug`, i.e. API response-body logging |

- Always `import { env } from '@utils/env';`. Never read `process.env` in tests or pages. `playwright.config.ts` reads `process.env.CI`, and that's the only place it's allowed.
- `.env.example` **deliberately doubles as the default local config**, so `npx playwright test` works against the docker stack with no setup. Keep it pointing at `localhost:8080` with the provisioned credentials. It ships with `DEBUG=true`, so local runs print API response bodies; set it to `false` for quieter output.
- `.env*` is gitignored except `.env.example`. To add an environment, create `.env.<name>` and run with `ENV=<name>`.
- CI (`.github/workflows/playwright.yml`) sets `ENV=ci` and the variables inline, with no file and no `DEBUG`.
- A CI-mode run locally needs `CI=1`. `ENV=ci` alone fails with `Environment file not found: .env.ci`.
- Pointing `API_BASE_URL` at a different host only works if the session cookie in `auth.json` is valid there. `auth.setup.ts` logs in through the UI on `BASE_URL`, and the `api` project reuses that cookie.

---

## 9. Test data

- **Builders** (`src/data/builders/`) are fluent, and every setter returns `this`:
    ```ts
    new UserBuilder().asAdmin().enabledUser().buildForUi(); // UIUserFormData → page object
    new UserBuilder().asAdmin().enabledUser().buildForApi(); // APIUserData    → UsersApi
    ```
    The same builder produces the UI shape (labels: `'Admin'`, `'Enabled'`) and the API shape (ids: `userRoleId: 1`, `status: true`). It maps between them through `Roles` and `Status` in `@constants`.
- **Uniqueness:** usernames are `user_${Date.now()}${faker 3-digit}`, so tests are safe under `fullyParallel: true`. Every created entity must be unique per run.
- **Seed dependencies:**
    - The builder defaults to `empNumber: 1` and `DEFAULT_EMPLOYEE_NAME = 'Qui  Ngo'`. Both must match `docker/installer/cli_install_config.yaml`.
    - The **double space** in the name is intentional. It matches OrangeHRM's rendering of a blank middle name.
- **Constants** hold the lookup tables: `Routes` (UI paths), `Endpoints` (API paths), `Roles`, `Status` and `DEFAULT_PASSWORD`.
    - They're all `as const` objects with camelCase keys.
    - `Roles` and `Status` entries are `{ code, label }`. `code` is the API value (`Roles.admin.code === 1`, `Status.enabled.code === true`) and `label` is the UI text.
    - Don't hardcode paths, role ids, labels or passwords in specs.
- **Negative payloads** are built from the builder, not written by hand. Strip a field with rest destructuring (ESLint's `ignoreRestSiblings` is on for this):
    ```ts
    const { empNumber, ...userWithoutEmpNumber } = new UserBuilder()
        .asAdmin()
        .enabledUser()
        .buildForApi();
    ```
- **Cleanup:**
    - Data created with `usersApi.create()` is deleted automatically in fixture teardown.
    - Data created **through the UI** must be registered with `usersApi.trackForCleanup(user.username)` **before** the UI steps, so teardown removes it even if the test fails midway (see `TC-UserManagement-001`). This is why that spec uses `merged.fixture`.
    - Any resource a test creates by hand (such as a `request.newContext()`) is released in a `finally` block.
- **API seeding:** seeding UI tests through the API is encouraged (`TC-UserManagement-002`).

---

## 10. Authentication

- **Setup project:** the `setup` project runs `tests/auth.setup.ts` (matched by `/.*\.setup\.ts/`). It logs in via `LoginPage` with `env.username/password`, confirms with `dashboardPage.expectLoaded()`, and saves `auth/storageState/auth.json`.
- **Shared session:** the chromium, firefox, webkit and api projects all use `storageState: 'auth/storageState/auth.json'` and depend on `setup`. Every test therefore starts **logged in as admin**, and API calls through the `request` fixture carry the session cookie.
- **Logged-out UI tests** clear storage at describe level:
    ```ts
    test.describe('Login', () => {
        test.use({ storageState: { cookies: [], origins: [] } });
        ...
    });
    ```
    - `login.spec` and the `'Header - logged out'` block of `header.spec` use this.
    - A test that logs out or changes the password **must** run logged-out like this and log in itself. Otherwise it would invalidate the shared session.
- **Logged-out API tests** create a fresh context, wrap it in `ApiClient`, and dispose of it in `finally`:
    ```ts
    const anonymous = await request.newContext({
        baseURL: env.apiBaseUrl,
        storageState: { cookies: [], origins: [] },
    });
    const anonymousClient = new ApiClient(anonymous);

    try {
        const response = await anonymousClient.get(Endpoints.users.base);
        await anonymousClient.expectStatus(response, 401);
    } finally {
        await anonymous.dispose();
    }
    ```
- **Roles:** there is only one role (admin). There's no multi-user storage state.

---

## 11. Test structure, naming and tagging

**Spec skeleton (UI):**

```ts
import { test } from '@fixtures/pom.fixture';

test.describe('Header', () => {
    test.beforeEach(async ({ dashboardPage }) => {
        await dashboardPage.open();
        await dashboardPage.expectLoaded();
    });

    test('TC-Header-001: Show About popup', async ({ dashboardPage }) => {
        await dashboardPage.header.openAbout();
        await dashboardPage.header.expectAboutVisible();
    });
});
```

- **Describes:** there's one top-level `test.describe` per spec, named after the feature in plain words: `'Login'`, `'Header'`, `'User Management'`, `'Users API'`. A second describe is used only to change `test.use` options, and is named `'<Feature> - <variant>'` (`'Header - logged out'`).
- **Navigation:** every navigation is `open()` followed by `expectLoaded()`. It goes in `beforeEach` when all tests start on the same page, and inline in the test otherwise.
- **Cleanup:** there's no `afterEach`/`afterAll`; cleanup lives in fixtures.
- **Fixtures** are destructured in the test signature. `page` is never used directly in UI specs.
- **Test bodies** are a flat sequence of `await pageObject.action()` / `await pageObject.expectX()` calls. There's no `test.step`.

**Titles:**

Every test, UI and API alike, is titled `TC-<Feature>-<NNN>: <Capitalised sentence>`:

- `<Feature>` is PascalCase and matches the spec file: `Login`, `Header`, `UserManagement`, and `UsersApi` for `users.api.spec.ts`.
- `NNN` is a zero-padded 3-digit number continuing the file's sequence. Existing numbers are never reused or renumbered.
- UI sentences describe the user outcome (`Add new user successfully`). API sentences describe the behaviour, including the status code for negative cases (`Rejects a duplicate username with 422`).

**Tagging:**

- **The suite has no tags.** There's no `@smoke`/`@regression` in titles, no `{ tag: [...] }` option and no annotations.
- The only selectors are the project, the file path and the `TC-` id (via `--grep`).
- Don't invent a tag scheme without agreeing it first. If one is introduced, prefer Playwright's `{ tag: '@x' }` option.

No `test.skip`, `test.fixme`, `test.fail` or `test.only` exist (and `forbidOnly` is on in CI).

---

## 12. Commands

npm scripts: `test`, `test:headed`, `test:debug`, `test:ui-mode`, `report`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`. `test:example` is identical to `test`, because `example` is already the default ENV.

Verified with `--list` against the current suite (32 tests: 1 setup + 8 UI × 3 browsers + 7 API):

```bash
npx playwright test                                   # everything: setup + chromium + firefox + webkit + api (32)
npx playwright test --project=chromium                # UI on one browser (8 + setup)
npx playwright test --project=api                     # API only (7 + setup)
npx playwright test --project=api --no-deps           # API only, reuse existing auth.json (7)
npx playwright test --project=chromium tests/ui/admin # a folder
npx playwright test tests/ui/login.spec.ts --project=chromium   # one file
npx playwright test tests/ui/login.spec.ts:16 --project=chromium # one test by line
npx playwright test --project=chromium -g "TC-Header"      # a feature by TC prefix
npx playwright test --project=chromium -g "TC-Login-002"   # a single TC
npx playwright test --project=api -g "TC-UsersApi-00[67]"  # grep takes a regex
npx playwright test --project=chromium --grep-invert "TC-Header-004"
ENV=staging npx playwright test                       # use .env.staging
npx playwright test --project=chromium --headed       # or: npm run test:headed -- --project=chromium
npm run test:debug -- tests/ui/login.spec.ts --project=chromium
npm run report                                        # open last HTML report
```

- Always pass `--project=chromium` for fast local UI runs. Without it, every UI test runs 3×.
- The `setup` project runs for any filtered run of a dependent project (even with `-g`). Use `--no-deps` to skip it when `auth.json` is still valid.

**Before committing:**

- Run `npm run typecheck && npm run lint && npm run format:check`. All three are clean today, with zero lint warnings; keep it that way.
- The Husky pre-commit hook runs lint-staged (`eslint --fix`, `prettier --write`, `tsc --noEmit`) on staged `.ts` files.
- Prettier settings: 4-space indent, single quotes, width 100, trailing commas.

---

## 13. Known gaps

There are none open. The full suite (32 tests: setup, chromium, firefox, webkit, api) passes against the docker stack, and the code follows every rule above.

- **Cleanup check:** after three full runs, no user created by those runs was left behind.
- **Old leftovers:** the instance still holds 10 older `user_*` accounts, from 2026-08-20/21. They predate `trackForCleanup()` and are consistent with the old leak.

If you find a new inconsistency, add a row here (area, what differs, next step) rather than silently picking one side.

**Resolution log** (the original audit IDs, kept so history can be traced):

- **I-1:** all files are camelCase with a dot-suffix (`sideNav.component.ts`, `user.builder.ts`).
- **I-2:** the spec is named after the feature (`userManagement.spec.ts`, `TC-UserManagement-NNN`).
- **I-3:** alias imports everywhere.
- **I-4:** locators are private and typed.
- **I-5:** static locators live in the constructor; the duplicate locator is gone.
- **I-6:** components are composed into pages; the `sideNavComponent` fixture is removed.
- **I-7:** explicit return types.
- **I-8:** one page object per route with `open()` + `expectLoaded()`; `expectRoute()` checks against `Routes`; no hidden navigation.
- **I-9:** `apiClient.expectStatus()` for status codes; the `ApiErrorResponse` model.
- **I-10:** `env.apiBaseUrl` drives the `api` project; `DEBUG` enables API body logging; `.env.example` as the default is documented as intentional.
- **I-11:** `trackForCleanup()` for UI-created users.
- **I-12:** a `TC-` id and capitalised sentence on every test.
- **I-13:** builders and constants in specs; `Roles` has camelCase keys and numeric codes.
- **I-14:** `Logger` is the only console writer and is used only by `ApiClient`.
- **I-15:** uniform `expect` re-export.
- **I-16:** stale docs fixed.
- **Also fixed:**
    - The describe names now match their features.
    - `headerUsermenu` is renamed to `userMenu`.
    - `menuItem()` has a return type.
    - `BasePage.getTitle()` (dead code) is removed.
    - The 401 test disposes its context in `finally`.
    - `DashboardPage` uses `getByRole('heading', { name: 'Dashboard' })` like the other pages (it was a CSS `h6`).
    - `ApiErrorResponse` was corrected from real responses (`data` is optional; `status` is `string | number`).
