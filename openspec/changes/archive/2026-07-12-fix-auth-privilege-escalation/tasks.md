## 1. Prevent client-assignable privileged fields

- [x] 1.1 In `src/infrastructure/auth/better-auth.ts`, add `input: false` to the `role` additional field (keep `type`, `defaultValue: 'CLIENT'`, `required: true`)
- [x] 1.2 In the same file, add `input: false` to the `isActive` additional field (keep `type`, `defaultValue: true`)

## 2. Block authentication for deactivated users

- [x] 2.1 Confirm the user table + `isActive` column export names in `src/infrastructure/db/auth-schema.ts` and that `eq` is importable from `drizzle-orm`
- [x] 2.2 Add `databaseHooks.session.create.before` to the `betterAuth({...})` config that looks up the session's user by `session.userId` via the existing `db` instance and throws `APIError('UNAUTHORIZED', { message: 'Account is deactivated' })` when `isActive === false`
- [x] 2.3 Import `APIError` from `better-auth/api` and reuse the top-level `db` and `schema` already defined in the file (no new DB instance)

## 3. E2E coverage

- [x] 3.1 In `test/controllers/auth.e2e.spec.ts`, add a test: `POST /api/auth/sign-up/email` with `role: 'ADMIN'` in the body does NOT yield an admin — assert the user cannot reach an `@Roles(['ADMIN'])` route (e.g. `GET /api/v1/users` returns 403), or that sign-up returns 400
- [x] 3.2 Add a test: a user whose `isActive` is set to `false` (via the suite pool SQL, mirroring `createUserAndLogin`) is denied at `POST /api/v1/auth/login` with 401 and no token
- [x] 3.3 Add a test: a normal active user still logs in successfully (200 + token) — guards against over-blocking

## 4. Quality gate and docs

- [x] 4.1 Run `pnpm lint`, `pnpm check`, `pnpm test` — all pass
- [x] 4.2 Run `pnpm test:e2e` (requires `docker compose up -d`) — auth suite passes including the new cases
- [x] 4.3 Update `docs/business-rules.md`: note that `role`/`isActive` are server-assigned only (rejected at sign-up) and that the inactive-user login prohibition is now enforced
