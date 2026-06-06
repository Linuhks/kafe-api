## ADDED Requirements

### Requirement: E2E suites run against an isolated, freshly migrated PostgreSQL database
Each `*.e2e.spec.ts` suite SHALL execute against a dedicated PostgreSQL database whose name is `kafe_test_<uuid>` (UUID with dashes replaced by underscores). The database SHALL be created at the start of the suite via `CREATE DATABASE`, have all Drizzle migrations from `src/infrastructure/db/migrations/` applied to it, and SHALL be dropped at the end of the suite. No two suites SHALL ever share a database.

#### Scenario: Suite startup creates and migrates a unique database
- **WHEN** a suite calls `await helper.setup()` in `beforeAll`
- **THEN** a database named `kafe_test_<uuid>` exists in the cluster, contains every table defined in `src/infrastructure/db/schema.ts` and `src/infrastructure/db/auth-schema.ts`, and the suite's `helper.app` is bound to that database

#### Scenario: Suite teardown removes the database
- **WHEN** a suite calls `await helper.teardown()` in `afterAll`
- **THEN** `SELECT datname FROM pg_database WHERE datname = '<kafe_test_uuid>'` returns zero rows

#### Scenario: Two suites running in parallel see independent state
- **WHEN** suite A inserts a row via the API and suite B queries the same endpoint
- **THEN** suite B does NOT see the row inserted by suite A

### Requirement: Cleanup runs even when a suite fails
The teardown SHALL drop the suite's database and close the suite's NestJS app even when an `it` block throws, when `beforeAll` partially succeeds, or when the process receives a non-fatal signal that triggers Vitest's `afterAll`. After a full `pnpm test:e2e` run — passing or failing — zero `kafe_test_*` databases SHALL remain in the cluster.

#### Scenario: Failed test still cleans up its database
- **WHEN** a test inside a suite throws an assertion error
- **THEN** `afterAll` still runs `helper.teardown()` and the suite's database is dropped

#### Scenario: No orphaned databases after a full run
- **WHEN** `pnpm test:e2e` completes (pass or fail)
- **THEN** `SELECT count(*) FROM pg_database WHERE datname LIKE 'kafe_test_%'` returns 0

### Requirement: The E2E NestJS app mirrors `main.ts` global wiring
The `E2ETestHelper.app` instance SHALL apply the same global prefix, validation pipe configuration, exception filter, and audit interceptor that `src/main.ts` applies, and SHALL be created with `bodyParser: false` so Better-Auth's raw-body handling works. Helmet, CORS, and Swagger SHALL NOT be applied.

#### Scenario: Validation errors return the documented envelope
- **WHEN** a suite sends a request body that violates a DTO constraint
- **THEN** the response is HTTP 400 with body `{ message: 'Validation failed', details: [{ field, message }, ...] }` matching the shape produced by `main.ts`'s `exceptionFactory`

#### Scenario: All endpoints are reachable under `/api/v1`
- **WHEN** a suite calls `GET /api/v1/products`
- **THEN** the request reaches `ProductsController.list` and returns HTTP 200; calling `GET /products` returns HTTP 404

#### Scenario: HttpExceptionFilter shapes thrown errors
- **WHEN** a controller throws a `NotFoundException` (e.g., `GET /api/v1/products/<unknown-uuid>`)
- **THEN** the response body matches the shape produced by `HttpExceptionFilter`, not the raw NestJS default

### Requirement: Better-Auth uses the suite database, not the developer database
Because `src/infrastructure/auth/better-auth.ts` opens a standalone pool from `process.env.DATABASE_URL` at module-import time, the helper SHALL set `process.env.DATABASE_URL` to the suite-specific URL **before** importing `AppModule`. The original `DATABASE_URL` value SHALL be restored during `teardown()`.

#### Scenario: Better-Auth writes land in the suite database
- **WHEN** a suite registers a user via `POST /api/v1/auth/sign-up/email`
- **THEN** a row appears in the `user` table of the suite's database, and no new row appears in the developer's `kafe` database

#### Scenario: Environment is restored after teardown
- **WHEN** a suite's `teardown()` completes
- **THEN** `process.env.DATABASE_URL` equals the value it held before `setup()` ran

### Requirement: `pnpm test:e2e` runs the Vitest E2E config
The `package.json` script `test:e2e` SHALL execute `vitest run --config vitest.e2e.config.ts`. A companion `test:e2e:watch` SHALL execute `vitest --config vitest.e2e.config.ts`. The unit-test script `pnpm test` SHALL NOT pick up `*.e2e.spec.ts` files.

#### Scenario: `pnpm test:e2e` discovers and runs E2E suites
- **WHEN** a developer runs `pnpm test:e2e`
- **THEN** Vitest executes every file matching `test/**/*.e2e.spec.ts` and exits with code 0 only if all suites pass

#### Scenario: `pnpm test` ignores E2E suites
- **WHEN** a developer runs `pnpm test`
- **THEN** no `*.e2e.spec.ts` file is executed and the run completes without requiring a database connection

### Requirement: Jest E2E tooling is removed
The legacy Jest E2E configuration (`test/jest-e2e.json`), the stale `test/app.e2e-spec.ts` file, and the Jest devDependencies (`jest`, `ts-jest`, `@types/jest`) SHALL be removed from the repository so there is exactly one E2E runner.

#### Scenario: Jest config no longer exists
- **WHEN** the change is applied
- **THEN** `test/jest-e2e.json` does not exist, `test/app.e2e-spec.ts` does not exist, and `package.json` lists none of `jest`, `ts-jest`, `@types/jest` in `devDependencies`

### Requirement: Every existing HTTP controller has an E2E suite
There SHALL be one `*.e2e.spec.ts` file per controller in `src/presentation/controllers/`. Each suite SHALL cover at least: (a) an unauthenticated request to a protected endpoint returns 401, (b) a happy-path request returns the documented success status with the documented response envelope, and (c) at least one validation or authorization failure path.

#### Scenario: Each controller has a corresponding suite file
- **WHEN** the change is applied
- **THEN** `test/controllers/` contains `auth.e2e.spec.ts`, `categories.e2e.spec.ts`, `products.e2e.spec.ts`, `orders.e2e.spec.ts`, `inventory.e2e.spec.ts`, `users.e2e.spec.ts`, and `dashboard.e2e.spec.ts`

#### Scenario: Protected endpoints reject unauthenticated requests
- **WHEN** a suite calls a protected endpoint (e.g., `POST /api/v1/products`) without a Bearer token
- **THEN** the response is HTTP 401

#### Scenario: Happy path returns the envelope from the OpenAPI spec
- **WHEN** a suite calls a list endpoint with a valid session
- **THEN** the response status matches the OpenAPI contract and the body shape matches the controller's response DTO
