## Why

Two authentication flaws let unauthenticated or deactivated users gain access they should not have. `role` and `isActive` are declared as Better-Auth user `additionalFields` without `input: false`, so the public `POST /api/auth/sign-up/email` route accepts a client-supplied `role` and persists it verbatim — any anonymous user can self-register as `ADMIN` (or as lowercase `admin` to unlock the Better-Auth `admin()` plugin's impersonation/ban endpoints). Separately, login only verifies email and password: `signInEmail` never checks `isActive`, so deactivated users can still authenticate, violating the documented rule in `docs/business-rules.md` ("Inactive users must not be able to authenticate").

## What Changes

- Mark `role` and `isActive` as non-client-writable (`input: false`) in the Better-Auth config so they can only be set server-side (SQL, seed, or admin endpoint) — closes the sign-up privilege-escalation vector. **BREAKING** for any client currently passing `role`/`isActive` to sign-up: Better-Auth now rejects the request with `400 FIELD_NOT_ALLOWED` instead of honoring the value.
- Add a Better-Auth `databaseHooks.session.create.before` hook that rejects session creation when the user's `isActive` is `false`, blocking both fresh logins and session issuance for deactivated accounts.
- Add E2E coverage: sign-up cannot escalate role, and a deactivated user cannot log in.

## Capabilities

### New Capabilities

- `auth-access-control`: Registration must not let clients assign privileged fields (`role`, `isActive`); authentication must reject users whose account is deactivated.

### Modified Capabilities

- None — no existing spec covers authentication or registration behavior.

## Impact

- **`src/infrastructure/auth/better-auth.ts`**: add `input: false` to the `role` and `isActive` additional fields; add `databaseHooks.session.create.before` returning/aborting when `isActive === false`.
- **`test/controllers/auth.e2e.spec.ts`**: add cases for role-escalation rejection and deactivated-user login rejection.
- **`docs/business-rules.md`**: note that role/isActive are server-assigned only and that the inactive-login rule is now enforced (documentation review on task completion).
- No schema/migration changes, no new dependencies. Existing seed (`seed.ts`) and E2E helper already assign roles via direct SQL, so they are unaffected.
