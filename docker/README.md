# Docker & CI setup

This documents the changes in the `Docker` commit (`3db3bec`): what was added,
why, and how to use it — both to run OrangeHRM locally and to understand how
GitHub Actions runs the same stack in CI.

## Why this exists

The Playwright suite needs a real OrangeHRM instance to test against. Locally
you might already have one running by hand; CI has nothing. These changes let
`docker compose` spin up a disposable OrangeHRM + MariaDB stack from scratch
and get it into a working, logged-in-able state automatically, in both places.

## What changed, file by file

### 1. `docker-compose.yml` (new)

Defines two services:

- **`orangehrm`** — the app (`orangehrm/orangehrm:latest`), published on host
  port `8080`, pointed at the `db` service via `ORANGEHRM_DATABASE_*` env vars.
- **`db`** — MariaDB 10.6, with an empty `orangehrm` database and an
  `orangehrm` user created via the standard `MYSQL_*` env vars. Data persists
  in the `orangehrm_db_data` named volume across restarts.

No `container_name` is set, so this can run side by side with any other
OrangeHRM stack you already have on your machine (they'll just get
auto-generated names under a different Compose project).

### 2. `docker/installer/cli_install_config.yaml` (new)

A fresh `orangehrm`/`db` pair starts **empty** — no admin user, no schema.
OrangeHRM ships an unattended CLI installer for exactly this case
(`installer/cli_install.php`), driven by this YAML file. It tells the
installer to:

- connect to `db` using the root credentials from `docker-compose.yml`,
- create the OrangeHRM schema on the already-existing empty `orangehrm` database,
- create the app-level DB user `orangehrm` / `orangehrm`,
- create one admin login: username **`orangehrm`**, password **`Admin@0123`**,
- create one employee record: **Qui Ngo** (this is what
  `userBuilder.ts`'s `buildForUi()` hardcodes as the employee to pick in the
  "Add User" test — they must stay in sync).

The installer deletes this file itself after a successful run (it holds
plaintext DB credentials), so it's safe to commit — it's just a template.

### 3. `docker/install-orangehrm.sh` (new)

A shell script that drives the setup:

1. Polls `db` with `mysqladmin ping` until it's accepting connections.
2. Copies `cli_install_config.yaml` into the `orangehrm` container and runs
   the CLI installer.
3. Polls `http://localhost:8080/web/index.php/auth/login` until it returns
   `200`.

It's idempotent — if you run it against an already-installed instance, the
installer just prints "This system already installed." and exits cleanly.

### 4. `.github/workflows/playwright.yml` (updated)

Added to the `test` job:

- A job-level `env:` block setting `BASE_URL`, `API_BASE_URL`, `ENV: ci`, and
  `TEST_USERNAME` / `TEST_PASSWORD` (defaulting to `orangehrm` / `Admin@0123`,
  overridable by repo secrets — see below).
- `docker compose up -d` — starts the stack.
- `docker/install-orangehrm.sh` — provisions it (steps above).
- `docker compose down -v` (with `if: always()`) — tears everything down
  after the tests run, pass or fail.

### 5. `src/utils/env/env.ts` (updated)

Previously this **always** required a `.env.<ENV>` file on disk and threw if
it was missing. That file (`.env.example` etc.) is gitignored, so it never
existed on a fresh CI checkout — meaning CI failed before a single test ran.

Now: if the file exists, it's loaded as before (unchanged local behavior). If
it's missing **and `CI` is set** (GitHub Actions sets this automatically), the
loader just skips straight to `validateEnv()`, which reads `BASE_URL` /
`TEST_USERNAME` / `TEST_PASSWORD` directly from `process.env` — i.e. from the
workflow's `env:` block instead of a file.

## Running it locally

```bash
# 1. Start the stack (from the repo root)
docker compose up -d

# 2. Provision it (creates the admin login + the "Qui Ngo" employee)
docker/install-orangehrm.sh

# 3. App is now up at http://localhost:8080
#    Login: orangehrm / Admin@0123
```

Then point your `.env.<ENV>` file at it (e.g. `.env.example`):

```
BASE_URL=http://localhost:8080
TEST_USERNAME=orangehrm
TEST_PASSWORD=Admin@0123
```

and run the suite as usual:

```bash
npx playwright test
```

To tear down:

```bash
docker compose down       # keep the DB volume (reuse next time, already installed)
docker compose down -v    # also delete the DB volume (next `up` starts fully fresh)
```

If you already run OrangeHRM locally some other way (e.g. a separate
`orangehrm-local` project), this stack is independent of it — just make sure
you're not trying to bind port `8080` twice at once.

## How it runs in GitHub Actions

Every push/PR to `main`/`master` triggers `.github/workflows/playwright.yml`,
which:

1. Checks out the repo, installs Node deps and Playwright browsers.
2. Runs `docker compose up -d` — same `docker-compose.yml` as local dev.
3. Runs `docker/install-orangehrm.sh` — same provisioning as local dev.
4. Runs `npx playwright test`, with `BASE_URL`/`TEST_USERNAME`/`TEST_PASSWORD`
   coming from the job's `env:` block (no `.env` file needed, per the
   `env.ts` change above).
5. Uploads the HTML report as a build artifact.
6. Always tears the stack down (`docker compose down -v`), even on failure.

### Changing credentials for CI

The workflow's defaults (`orangehrm` / `Admin@0123`) match what
`cli_install_config.yaml` provisions, so it works out of the box. If you'd
rather not have even these throwaway demo credentials sitting in plain YAML,
override them with repo secrets:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository
   secret**.
2. Add `TEST_USERNAME` and `TEST_PASSWORD` with whatever values you want.
3. **Also update `docker/installer/cli_install_config.yaml`** (`admin.adminUserName`
   / `admin.adminPassword`) to match — the installer is what actually creates
   that login, so the two must agree.

### Changing the app port / base URL

If you need a different port, update it in three places together:

- `docker-compose.yml` → the `orangehrm` service's `ports:` mapping.
- `docker/install-orangehrm.sh` → the `localhost:8080` readiness check URL.
- `.github/workflows/playwright.yml` → `BASE_URL` / `API_BASE_URL` in `env:`.

### Changing the seeded employee name

The "Add User" test (`userBuilder.ts`'s `buildForUi()`) hardcodes the
employee it selects from the Employee Name autocomplete. If you ever change
that name, update `cli_install_config.yaml`'s `admin.adminEmployeeFirstName`
/ `adminEmployeeLastName` to match — the installer creates that employee from
the admin account's name field, since a fresh instance has no employees
otherwise.
