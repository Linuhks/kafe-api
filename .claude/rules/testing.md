# Testing

## Unit tests (Vitest)

- Every use case has a sibling `.spec.ts` (`create-order.use-case.ts` → `create-order.use-case.spec.ts`). Not optional.
- Specs run against in-memory fakes — no database, no NestJS bootstrap.
- Vitest only picks up specs under `src/application/use-cases/`, `src/domain/errors/` and `src/presentation/filters/` (see `vitest.config.ts`).
- Fakes live in `test/repositories/` (`InMemory*Repository` extending the abstract interface, public `items` array for assertions) and are imported via `@test/repositories/...`. When `schema.ts` changes, mirror it in the matching fake.
- A passing unit test proves the use case's logic, not that controller, DB and auth guard are wired together.

```bash
pnpm test                          # all unit tests
pnpm test -- path/to/file.spec.ts  # one file
```

## E2E tests

- Suites are `test/controllers/<resource>.e2e.spec.ts`; they need PostgreSQL (`docker compose up -d`), ≥ 13 with `CREATEDB` privilege.
- Each suite creates a fresh `kafe_test_<uuid>` database, runs the migrations, boots the full `AppModule` and drops the database on teardown, even when tests fail.
- Always pair `await helper.setup()` with `helper.teardown()`.
- Use real auth: `createUserAndLogin` signs up via Better-Auth, promotes the role via SQL, then logs in for the bearer token.
- Prefix endpoints with `/api/v1/` (the helper sets the global prefix).
- Use `toMatchObject` for partial assertions; assert only what the test validates.
- Don't share state across `describe` blocks — order is not guaranteed.
- A change to a controller endpoint, an auth/role check or a stateful flow (orders, inventory, auth) needs its E2E suite run before the task is done. If no suite exists for the area, add one or say in the commit/PR why a manual run was enough.
- Security-sensitive changes need a negative test (wrong role, deactivated user, unauthenticated request) proving the rejection happens.

```bash
pnpm test:e2e              # all suites
pnpm test:e2e -- orders    # one suite
```

`test:e2e` is excluded from the per-subtask gate (slow, needs PostgreSQL) but runs in the pre-push hook and before opening a PR.
