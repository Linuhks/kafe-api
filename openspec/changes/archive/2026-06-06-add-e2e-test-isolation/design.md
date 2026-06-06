## Context

The project currently has no working E2E suite. `test/app.e2e-spec.ts` calls `GET /` on `AppController.getHello()`, an endpoint that no longer exists; the suite runs through Jest (`test/jest-e2e.json`) while every other test suite in the repo uses Vitest. The unit tests (`pnpm test`) cover use cases and filters with in-memory fakes from `src/test/repositories/`, but no test exercises the HTTP boundary, real validation, real guards, or real Drizzle SQL.

Three downstream constraints shape the design:

1. **Drizzle migrations are schema-qualified to `public`.** Both `0000_nifty_miracleman.sql` and `0001_typical_colossus.sql` reference `"public"."movement_type"`, `"public"."order_status"`, `"public"."user_role"`, and FKs like `"public"."orders"`. A naive `SET search_path TO test_schema_X; run-migrate` would leak enum types and FK targets into `public`, defeating isolation.
2. **Better-Auth opens its own pool at module-load time.** `src/infrastructure/auth/better-auth.ts:10` reads `process.env.DATABASE_URL` and instantiates `new Pool(...)` as a side effect of `import`. Overriding the `DATABASE_URL` token through NestJS DI is too late — Better-Auth has already captured the env var. The override must happen before `AppModule` is imported.
3. **Drizzle Service is request-singleton per app.** `DrizzleService` (src/infrastructure/db/drizzle.service.ts) creates one `Pool` per app instance via `ConfigService.getOrThrow('DATABASE_URL')`. Each suite's helper must boot a fresh `AppModule` so each suite gets its own pool pointing at its own isolated database/schema.

The reference plan from `.taskmaster/tasks/tasks.json#14` proposed schema-per-suite isolation. After tracing the constraints above, schema-per-suite is **not viable** without a custom migration rewriter or regenerating all migrations without `public.` prefixes. We need to choose a different isolation primitive.

## Goals / Non-Goals

**Goals:**
- Every E2E test suite SHALL run against a freshly migrated database that no other suite touches.
- Isolation SHALL survive test failures (no leftover databases/schemas after a crashed suite).
- The helper API SHALL be small: `setup() → app` and `teardown()`. Suites focus on HTTP behavior, not bootstrapping.
- Suites SHALL run in parallel without cross-talk so the wall-clock time of `pnpm test:e2e` scales with worker count.
- The boot path SHALL apply the same global pipes, filters, interceptors, and `setGlobalPrefix('api/v1')` as `main.ts`, so suites exercise the real request/response shape.
- `pnpm test:e2e` SHALL exit with non-zero on the first failing suite (no swallowed errors from teardown).

**Non-Goals:**
- Not introducing testcontainers or Docker-in-Docker. The existing `docker compose up -d` already provides a local PostgreSQL.
- Not seeding production-like fixtures. Each suite builds the rows it needs via the API or direct Drizzle calls; no shared seed file for E2E.
- Not building snapshot or contract testing. Suites assert on response shape with `toEqual`/`toMatchObject`.
- Not running E2E in `pnpm test`. Unit tests stay fast; E2E runs under its own script and is gated separately in CI.
- Not refactoring Better-Auth's standalone pool — out of scope; we work around it instead.

## Decisions

### Decision 1: Database-per-suite, not schema-per-suite

We will create a fresh, UUID-named **database** per suite (`CREATE DATABASE kafe_test_<uuid_underscored>`), connect to it with a per-suite `DATABASE_URL`, and `DROP DATABASE ... WITH (FORCE)` on teardown.

**Why over schema-per-suite:**
- The existing migration SQL hardcodes `public.` qualifiers (10 occurrences in `0000_nifty_miracleman.sql` alone). Schema-per-suite would require either regenerating all migrations without prefixes (and reconfiguring Drizzle to omit them — Drizzle currently emits `public` because that's the search_path default) or runtime-rewriting the SQL before execution. Both are brittle.
- Better-Auth's standalone pool reads only `process.env.DATABASE_URL`. Pointing it at a different *database* is a one-env-var change. Pointing it at a different *schema* would require Better-Auth to support `search_path` configuration, which it does not.
- Postgres `CREATE DATABASE` from a template can be ~100–300 ms; with Vitest's worker pool we amortize across suites. We accept this cost for migration-compatibility correctness.

**Alternatives considered:**
- **Schema-per-suite with runtime SQL rewrite** — Read each `.sql` migration, regex-replace `"public"."` → `"<suiteSchema>"."` before executing. Fast (no DB creation overhead) but brittle: future migrations may use other qualifier patterns and silently break isolation.
- **Single test database with truncate-between-tests** — Simplest, but kills parallelism between suites. Two suites racing on the same table fail nondeterministically.
- **Single test database with transaction rollback** — NestJS request lifecycle plus Better-Auth's separate pool make per-test transactions hard to wrap. We'd need to plumb a transaction handle through every repo. Too invasive.

### Decision 2: Mutate `process.env.DATABASE_URL` before importing `AppModule`

The helper's `setup()` SHALL:

1. Generate the unique DB name and create the database against an admin connection (using the original `DATABASE_URL` from `.env`).
2. Build the suite-specific connection string.
3. Assign `process.env.DATABASE_URL = suiteDbUrl` **before** `await import('../../src/app.module')`.
4. Use `Test.createTestingModule({ imports: [AppModule] })` and `.compile()`.

**Why:** `src/infrastructure/auth/better-auth.ts:10` calls `new Pool({ connectionString: process.env.DATABASE_URL })` as a top-level side effect. By mutating the env var first and using dynamic `import()`, Better-Auth captures the suite's URL. `ConfigService` will also pick it up because we mutate before `ConfigModule.forRoot()` reads `.env`. We restore the original value in `teardown()`.

**Tradeoff:** This requires every E2E suite to use dynamic imports of `AppModule` (or rely on the helper to do the import internally). We accept the small ergonomic cost in exchange for not having to refactor Better-Auth's wiring.

**Alternatives considered:**
- **Provide AppModule wrapper that DI-overrides DATABASE_URL** — Doesn't reach Better-Auth (which doesn't go through DI for its pool).
- **Refactor Better-Auth to take a pool from DI** — Cleaner long-term but expands scope. Track as a follow-up.

### Decision 3: Per-Vitest-worker admin pool, per-suite connection pool

The helper SHALL hold:
- One module-level `adminPool` (connected via the original `DATABASE_URL`, used only for `CREATE DATABASE` and `DROP DATABASE` admin SQL). Created lazily on first `setup()` call within a worker, closed in a `globalTeardown` hook.
- One per-suite `Pool` opened against the new database, used to run migrations and (later) for any helper queries the suite needs.

**Why:** `CREATE DATABASE` cannot run inside a transaction and is forbidden on the database you're currently connected to. The admin connection must point at a *different* database (typically `postgres` — the default maintenance DB).

### Decision 4: Run migrations via `drizzle-orm/node-postgres/migrator` per suite

The helper SHALL call `migrate(db, { migrationsFolder: './src/infrastructure/db/migrations' })` against the suite database immediately after creation. Migrations are idempotent and small (~2 files today); cost is ≤ 1 s per suite on local SSD.

**Alternative considered:** Snapshot a "template" database via `CREATE DATABASE ... TEMPLATE kafe_test_template` after running migrations once per worker. Faster (single migrate per worker) but adds complexity. We can add this optimization later if E2E wall-clock becomes painful.

### Decision 5: Boot a full `AppModule` per suite, mirror `main.ts` setup

The helper's `setup()` SHALL apply:
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true, exceptionFactory: ... }))` — same shape as `main.ts:30`.
- `app.useGlobalFilters(new HttpExceptionFilter())` — same as `main.ts:47`.
- `app.useGlobalInterceptors(new AuditInterceptor())` — same as `main.ts:48`.
- `app.setGlobalPrefix('api/v1')` — same as `main.ts:24`.
- `bodyParser: false` on `NestFactory.create` — required by Better-Auth (matches `main.ts:18`).

`app.use(helmet())`, CORS, and Swagger are intentionally omitted (no value for E2E; Helmet rewrites response headers in ways that complicate Supertest assertions).

### Decision 6: One Vitest config dedicated to E2E

Add `vitest.e2e.config.ts` with:
- `include: ['test/**/*.e2e.spec.ts']`
- `testTimeout: 30_000`, `hookTimeout: 30_000` (DB creation + migration headroom)
- `pool: 'threads'`, `poolOptions.threads.singleThread: false` (parallel suites)
- `globalSetup: ['./test/helpers/e2e-global-setup.ts']` (verify admin connectivity once; fail fast if Postgres is down)

The default `vitest.config.ts` continues to run unit tests only — its `include` already excludes `test/**`.

### Decision 7: Replace Jest entirely

Delete `test/app.e2e-spec.ts`, `test/jest-e2e.json`. Remove `jest`, `ts-jest`, `@types/jest` from `devDependencies`. The `test:e2e` script in `package.json` is updated from `jest --config ./test/jest-e2e.json` to `vitest run --config vitest.e2e.config.ts`.

**Why:** Two test runners doubles maintenance and confuses CI matrices. Vitest is already the team's chosen runner.

### Decision 8: Helper API

```typescript
// test/helpers/e2e-test-helper.ts
export class E2ETestHelper {
  app!: INestApplication;
  async setup(): Promise<void>;       // creates DB, migrates, boots AppModule
  async teardown(): Promise<void>;    // closes app, drops DB, restores env
  getDbName(): string;                // for assertions/debug
}
```

Each suite owns one helper instance, calls `setup()` in `beforeAll` and `teardown()` in `afterAll`. Per-test cleanup (between `it` blocks) is the suite's responsibility — most suites won't need it because each suite has its own database.

## Risks / Trade-offs

- **Risk:** `CREATE DATABASE` requires `CREATEDB` privilege; local docker-compose Postgres has it by default but CI Postgres images may not.
  → Document the privilege requirement in `docs/code-guide.md`. The default `postgres` superuser in the official `postgres` image has it; production-shaped CI users may need an explicit `GRANT`.
- **Risk:** Database creation cost dominates wall-clock for small suites.
  → Acceptable for now (≤ ~300 ms per suite). Future optimization: template-database snapshot (Decision 4 alternative).
- **Risk:** Mutating `process.env.DATABASE_URL` is a global side effect; concurrent suites in the same worker would step on each other.
  → Vitest gives each suite file its own worker by default with `pool: 'threads'`; we are not running multiple `describe` blocks per file against different DBs. If a future refactor changes this, the helper must be revisited.
- **Risk:** `DROP DATABASE ... WITH (FORCE)` requires Postgres ≥ 13. Docker compose currently pins a modern version; verify the CI image matches.
  → Document the version requirement in `docs/code-guide.md`. Fallback: terminate connections via `pg_terminate_backend`, then `DROP DATABASE` without `FORCE`.
- **Trade-off:** Each suite re-boots the entire `AppModule`. For 7 controllers × ~500 ms boot, that's ~3.5 s of boot overhead per `pnpm test:e2e` run on a single thread. Parallel workers amortize this. Acceptable.
- **Trade-off:** Suites cannot share fixtures across files cheaply because each file has its own DB. Considered acceptable — E2E should be self-contained per suite anyway.
- **Risk:** Better-Auth's standalone pool (Decision 2 workaround) means a future change to Better-Auth's init could break the E2E helper silently.
  → Add a `console.log` (or test assertion) in CI verifying the auth pool reaches the suite database, not the dev database. Track refactoring Better-Auth to accept a DI'd pool as a follow-up task.

## Migration Plan

1. Land the helper, config, and one reference suite (`test/controllers/products.e2e.spec.ts`) green locally against `docker compose up -d`.
2. Land the remaining six controller suites. They can be added in any order.
3. Delete Jest artifacts and devDeps in the same commit as the script rename to avoid a broken `pnpm test:e2e` window.
4. Update docs (`docs/workflow-dev.md`, `docs/code-guide.md`) to describe the new command and the database isolation model.
5. (Follow-up, not in this change) Add a CI job that runs `pnpm test:e2e` against a service-container Postgres.

No rollback needed beyond `git revert` — this change is purely additive to test infrastructure and removes only the broken Jest E2E suite, which is already non-functional.

## Open Questions

- Should the helper expose a `getAdminToken(role: 'ADMIN' | 'BARISTA' | 'CLIENT')` convenience that creates a user via Better-Auth and returns a Bearer token? Leaning yes (most suites need auth), but defer to the implementation phase so we can see the call-site ergonomics first.
- Do we want a `--coverage` profile for E2E? Probably not in this change — E2E coverage numbers are misleading. Revisit if anyone asks.
