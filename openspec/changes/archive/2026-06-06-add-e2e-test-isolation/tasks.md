## 1. Vitest E2E config and scripts

- [x] 1.1 Create `vitest.e2e.config.ts` at project root with `include: ['test/**/*.e2e.spec.ts']`, `testTimeout: 30_000`, `hookTimeout: 30_000`, `pool: 'threads'`, `poolOptions.threads.singleThread: false`, `globals: true`, `environment: 'node'`, and a `globalSetup` entry pointing at `./test/helpers/e2e-global-setup.ts`.
- [x] 1.2 Confirm `vitest.config.ts` still excludes `test/**` so `pnpm test` does not pick up E2E suites; if not, narrow its `include` accordingly.
- [x] 1.3 Replace the existing `"test:e2e": "jest --config ./test/jest-e2e.json"` script in `package.json` with `"test:e2e": "vitest run --config vitest.e2e.config.ts"` and add `"test:e2e:watch": "vitest --config vitest.e2e.config.ts"`.
- [x] 1.4 Remove `jest`, `ts-jest`, and `@types/jest` from `devDependencies` in `package.json`; run `pnpm install` to refresh the lockfile.

## 2. Global setup and admin connectivity

- [x] 2.1 Create `test/helpers/e2e-global-setup.ts` that, on startup, opens an admin `Pool` against `process.env.DATABASE_URL` (pointing at the maintenance DB — e.g., `postgres`) and runs `SELECT 1`. If the connection fails, throw with a clear error mentioning `docker compose up -d`.
- [x] 2.2 Export a `teardown` function from the same module that closes the admin pool; ensure no `kafe_test_*` databases are left behind by querying `pg_database` and dropping any matches with `WITH (FORCE)`.
- [x] 2.3 Snapshot the original `DATABASE_URL` into a module-level constant so the per-suite helper can restore it on teardown.

## 3. `E2ETestHelper` core

- [x] 3.1 Create `test/helpers/e2e-test-helper.ts` exporting a class `E2ETestHelper` with public field `app!: INestApplication`, public `getDbName(): string`, public async `setup(): Promise<void>`, and public async `teardown(): Promise<void>`.
- [x] 3.2 In `setup()`: generate `this.dbName = 'kafe_test_' + randomUUID().replace(/-/g, '_')`, derive `suiteUrl` from the original `DATABASE_URL` by swapping the database name segment, save the original `DATABASE_URL` on `this`, and assign `process.env.DATABASE_URL = suiteUrl`.
- [x] 3.3 In `setup()`: open an admin connection (separate `Pool` against the maintenance DB) and run ``CREATE DATABASE "${this.dbName}"``; close the admin pool immediately after.
- [x] 3.4 In `setup()`: open a per-suite `Pool` against `suiteUrl`, build a Drizzle instance with the combined `schema + authSchema`, and run `await migrate(db, { migrationsFolder: './src/infrastructure/db/migrations' })`. Keep the pool open for the rest of the suite if the helper exposes query utilities, otherwise close it.
- [x] 3.5 In `setup()`: dynamically import `AppModule` (so Better-Auth's top-level pool sees the new `DATABASE_URL`), call `Test.createTestingModule({ imports: [AppModule] }).compile()`, create the Nest app with `bodyParser: false`, and apply the same global pipes, filters, interceptors, and prefix as `src/main.ts:24-48` (omit Helmet, CORS, Swagger).
- [x] 3.6 In `setup()`: `await this.app.init()` and confirm `this.app.getHttpServer()` is ready before returning.
- [x] 3.7 In `teardown()`: `await this.app.close()` inside a `try` so failures don't skip DB cleanup; restore `process.env.DATABASE_URL` to the saved original; open a fresh admin connection and `DROP DATABASE IF EXISTS "${this.dbName}" WITH (FORCE)`; close the admin connection. All steps wrapped to log but not throw on individual failures so the outer test runner still surfaces the original test error.

## 4. Reference suite: products

- [x] 4.1 Create `test/controllers/products.e2e.spec.ts` with `beforeAll(() => helper.setup())` and `afterAll(() => helper.teardown())`.
- [x] 4.2 Add a `GET /api/v1/products` happy-path test asserting the response shape (envelope produced by `HttpExceptionFilter` siblings) and that the list is empty on a fresh suite database.
- [x] 4.3 Add a `POST /api/v1/products` test without auth asserting HTTP 401.
- [x] 4.4 Run `pnpm test:e2e` and confirm the suite passes against `docker compose up -d`; verify with `psql` that no `kafe_test_*` database remains after the run.

## 5. Remaining controller suites

- [x] 5.1 Add `test/controllers/auth.e2e.spec.ts` covering sign-up, sign-in returning a bearer token, and an unauthenticated request being rejected.
- [x] 5.2 Add `test/controllers/categories.e2e.spec.ts` covering list/create/update/delete happy paths and one 401 path.
- [x] 5.3 Add `test/controllers/orders.e2e.spec.ts` covering order creation, status transition, and one role-based authorization failure (e.g., CLIENT cannot delete).
- [x] 5.4 Add `test/controllers/inventory.e2e.spec.ts` covering stock movement creation and a validation-failure path for invalid quantity.
- [x] 5.5 Add `test/controllers/users.e2e.spec.ts` covering admin-only list and a non-admin 403 path.
- [x] 5.6 Add `test/controllers/dashboard.e2e.spec.ts` covering at least one read endpoint with auth.

## 6. Cleanup of legacy Jest E2E

- [x] 6.1 Delete `test/app.e2e-spec.ts`.
- [x] 6.2 Delete `test/jest-e2e.json`.
- [x] 6.3 Search for any remaining `jest`/`@types/jest` imports in `test/` and `src/` and remove or replace with Vitest equivalents.

## 7. Docs and dev workflow

- [x] 7.1 Update `docs/workflow-dev.md` to add `pnpm test:e2e` to the per-task gate (or document why it stays out of the per-subtask loop) and mention the `kafe_test_<uuid>` isolation model.
- [x] 7.2 Update `docs/code-guide.md` so the command table lists `pnpm test:e2e` and `pnpm test:e2e:watch`, documents the `CREATEDB` privilege requirement, and notes the PostgreSQL ≥ 13 requirement for `DROP DATABASE ... WITH (FORCE)`.
- [x] 7.3 Add a brief "E2E testing" section to the project `README.md` explaining how to run E2E locally (`docker compose up -d && pnpm test:e2e`).

## 8. Verification gate

- [x] 8.1 Run `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm test:e2e` in sequence; all four MUST pass.
- [x] 8.2 Manually verify isolation: start `pnpm test:e2e:watch`, in another shell connect to Postgres and observe `kafe_test_*` databases appearing during a suite and disappearing after, with zero left at the end.
- [x] 8.3 Manually verify failure cleanup: introduce a temporary `expect(true).toBe(false)` in one suite, run `pnpm test:e2e`, confirm the run fails AND the corresponding `kafe_test_*` database is still dropped; revert the temporary failure.
- [x] 8.4 Run `openspec validate add-e2e-test-isolation --strict` and confirm it passes before opening the PR.
