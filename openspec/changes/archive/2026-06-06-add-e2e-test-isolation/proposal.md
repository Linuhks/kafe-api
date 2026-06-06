## Why

We have no automated coverage of HTTP behavior end-to-end. The only existing E2E test (`test/app.e2e-spec.ts`) hits a stale `AppController.getHello()` route that no longer exists, runs through Jest (a stack we don't otherwise use), and shares the single development database — so it can't run in CI without contaminating data and can't run in parallel without cross-suite interference. As we approach launch (task 14 from `.taskmaster/tasks/tasks.json`), we need controller-level confidence in auth, guards, validation, and persistence without flaky shared state.

## What Changes

- Add a Vitest-based E2E test suite (`pnpm test:e2e`) that exercises every HTTP controller through Supertest against a real NestJS app and real PostgreSQL.
- Each test suite SHALL run inside its own UUID-named PostgreSQL schema, created and dropped automatically, so suites are isolated from each other and from the dev/seed data in `public`.
- Provide an `E2ETestHelper` that boots `AppModule`, applies the same global pipes/filters/guards as `main.ts`, runs Drizzle migrations into the isolated schema, and tears it down on completion (including on failure).
- Replace the Jest E2E setup: delete `test/jest-e2e.json` and `test/app.e2e-spec.ts`, drop the `test:e2e` script that calls Jest, and remove `jest`, `ts-jest`, `@types/jest` from devDependencies.
- Add `vitest.e2e.config.ts` with a longer test/hook timeout, a separate include glob (`test/**/*.e2e.spec.ts`), and parallel-safe pool options.
- Add `pnpm test:e2e` and `pnpm test:e2e:watch` scripts; wire the existing dev gate (`pnpm lint && pnpm check && pnpm test`) so contributors know E2E is opt-in locally but mandatory in CI.
- Ship reference E2E coverage for the seven existing controllers: `auth`, `categories`, `products`, `orders`, `inventory`, `users`, `dashboard`.

**BREAKING** for developer workflow only: `pnpm test:e2e` no longer runs Jest; anyone with cached Jest tooling should reinstall.

## Capabilities

### New Capabilities
- `e2e-test-infrastructure`: Defines how isolated end-to-end tests are configured, executed, and torn down — schema-per-suite isolation, helper API contract, controller coverage requirements, and CI/local gating rules.

### Modified Capabilities
<!-- None: no existing spec describes E2E testing today; this is a greenfield capability. -->

## Impact

- **Code**: New `test/helpers/e2e-test-helper.ts`, new `test/controllers/*.e2e.spec.ts` files, new `vitest.e2e.config.ts`, deletions of `test/jest-e2e.json` + `test/app.e2e-spec.ts`.
- **Scripts/Tooling**: `package.json` scripts (`test:e2e`, `test:e2e:watch`) and devDependency cleanup (remove `jest`, `ts-jest`, `@types/jest`).
- **Infrastructure**: Requires a reachable PostgreSQL instance at `DATABASE_URL` for E2E runs (same instance as `docker compose up -d` already provides locally). Each run creates and drops short-lived schemas — no migration of `public`.
- **Docs**: Update `docs/workflow-dev.md` and `docs/code-guide.md` to describe the new E2E command and isolation model; mention that E2E is part of the pre-PR gate.
- **CI**: A future CI job will need to set `DATABASE_URL` and run `pnpm test:e2e` after the unit-test step; out of scope for this change but unblocked by it.
- **Dependencies**: No new runtime deps. Removes Jest stack from devDependencies. Supertest stays (already installed).
