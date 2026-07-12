## Context

Authentication is handled by Better-Auth (`src/infrastructure/auth/better-auth.ts`), mounted through `@thallesp/nestjs-better-auth`. The app declares two custom user fields as Better-Auth `additionalFields`: `role` (ADMIN/BARISTA/CLIENT) and `isActive`. A security review confirmed, by tracing the installed Better-Auth source, two exploitable flaws:

1. **Mass-assignment on sign-up.** `POST /api/auth/sign-up/email` destructures the request body and passes every unrecognized key through `parseUserInput` (`sign-up.mjs:149,164`). `parseInputData` (`db/schema.mjs:41,68`) copies any additional field whose `input` is not `false` straight into the created user. Because `role` has no `input: false`, an anonymous client can send `role: "ADMIN"` and be persisted as an admin.
2. **No deactivation check at login.** Login (`auth.controller.ts` → `signInEmail`) validates only email + password; nothing consults `isActive`. `docs/business-rules.md` requires that inactive users cannot authenticate.

Both the app's custom `POST /api/v1/auth/login` route and Better-Auth's natively-mounted `POST /api/auth/sign-in/email` route are reachable, so any fix must hold at a point both paths share.

## Goals / Non-Goals

**Goals:**
- Prevent clients from assigning `role` or `isActive` during registration.
- Block authentication for users with `isActive === false`, at a choke point that covers every sign-in route.
- Add E2E coverage proving both, since these are HTTP-boundary behaviors that unit tests (in-memory, no Better-Auth) cannot exercise.

**Non-Goals:**
- Schema/migration changes. `isActive` already exists; we are not migrating to the `admin()` plugin's `banned` field.
- Reworking role management or adding an admin "set role" endpoint (roles are already set via SQL/seed).
- Revoking already-issued bearer tokens when a user is later deactivated — the hook blocks new session creation; live-token revocation is out of scope.

## Decisions

### D1 — `input: false` on `role` and `isActive`

**Decision:** Add `input: false` to both additional fields in `better-auth.ts`:
```typescript
role: { type: 'string', defaultValue: 'CLIENT', required: true, input: false },
isActive: { type: 'boolean', defaultValue: true, input: false },
```

**Rationale:** This is Better-Auth's own mechanism for server-owned fields. `parseInputData` (`db/schema.mjs:41-52`) special-cases `input === false`: it substitutes the `defaultValue` on create and throws `BAD_REQUEST` if a client tries to set the field. Fixing it at the auth config closes *both* the custom and native sign-up routes at once.

**Alternatives considered:** Validate the sign-up body in a NestJS DTO/pipe — rejected: sign-up is a Better-Auth route, not a Nest controller, so `ValidationPipe` never runs on it. A `before` request hook stripping `role` from the body — more code, and `input: false` already does exactly this with a clear error.

### D2 — Enforce `isActive` via `databaseHooks.session.create.before`

**Decision:** Reject session creation for deactivated users at the database hook level:
```typescript
databaseHooks: {
  session: {
    create: {
      before: async (session) => {
        const rows = await db
          .select({ isActive: schema.user.isActive })
          .from(schema.user)
          .where(eq(schema.user.id, session.userId))
          .limit(1);
        if (rows[0]?.isActive === false) {
          throw new APIError('UNAUTHORIZED', { message: 'Account is deactivated' });
        }
      },
    },
  },
}
```

**Rationale:** `createSession(userId, ...)` funnels through `createWithHooks(data, "session", ...)` (`internal-adapter.mjs:142-162`), and `with-hooks.mjs:11-18` runs `session.create.before` on every session creation — so this single hook covers the custom login route, the native `/api/auth/sign-in/email` route, and any future session issuance. Password verification runs before session creation, so the hook only sees authenticated attempts (no user-enumeration surface). Throwing `APIError('UNAUTHORIZED')` yields a clean 401 on the native route; the custom controller already wraps any Better-Auth error into `UnauthorizedException` (401), so both routes return 401. The hook reuses the `db` instance already constructed at the top of `better-auth.ts` — one indexed lookup by primary key on login only.

**Alternatives considered:**
- Check `result.user.isActive` inside `auth.controller.ts` after `signInEmail` — rejected: only guards the custom route; the natively-mounted `/api/auth/sign-in/email` bypasses it entirely.
- Return `false` from the hook instead of throwing — rejected: aborts the create but surfaces as `FAILED_TO_CREATE_SESSION` (400) on the native route; throwing `APIError('UNAUTHORIZED')` is semantically correct.

## Risks / Trade-offs

- **Extra DB query on every login** → Mitigation: it is a single primary-key lookup, only on session creation; negligible.
- **Deactivation does not revoke live sessions** → A user deactivated mid-session keeps access until their token expires or refreshes. Accepted per Non-Goals; the hook does block re-login and refresh-driven session creation, which bounds the exposure.
- **Existing integrations passing `role`/`isActive` to sign-up now get 400** → Intended (**BREAKING**). The seed and E2E helper already set roles via direct SQL, so nothing in this repo breaks; document the change in `docs/business-rules.md`.
- **`schema.user` table/column export name** → Verify the exact export in `auth-schema.ts` (`user` table, `isActive`/`is_active` column) when wiring the hook; adjust the query to match.

## Migration Plan

1. Edit `better-auth.ts` (D1 + D2). No dependency or schema changes.
2. Add E2E cases; run `pnpm lint && pnpm check && pnpm test`, then `pnpm test:e2e` (needs Postgres).
3. Deploy. Rollback is a straight revert of the single file — no data migration.
