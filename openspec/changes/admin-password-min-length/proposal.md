# Proposal

## Why

Better-Auth is configured with `minPasswordLength: 12` (`src/infrastructure/auth/better-auth.ts`), and `docs/API.md` documents 12 for `POST /api/v1/users`. That endpoint doesn't go through Better-Auth, though. `CreateUserDto` validates with `@MinLength(8)` and `DrizzleUserRepository.create` hashes the password directly. As a result, an admin can create accounts with 8–11 character passwords, which is weaker than the policy that every public sign-up has to meet.

## What Changes

- `CreateUserDto.password`: `@MinLength(8)` → `@MinLength(12)`, with the Swagger `minLength` and example updated to match.
- New requirement in `auth-access-control`: a password set at account creation has at least 12 characters, on every creation path.
- `LoginDto` is **not** changed. Better-Auth doesn't enforce the minimum at sign-in, and raising the login check would lock out existing accounts that have shorter passwords (seed users, accounts an admin already created).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `auth-access-control`: adds the minimum password length requirement for account creation.

## Impact

- Code: `src/presentation/dtos/users/create-user.dto.ts` only. No use case, repository or schema change, and no migration.
- API: `POST /api/v1/users` now returns 400 for passwords shorter than 12 characters. The response shape doesn't change.
- Docs: `docs/API.md` already says 12, so no change is needed there. The Swagger annotation is updated.

## Security Considerations

- **Client-writable fields**: `password` was already set by the admin, and the change only tightens it. No new field becomes writable.
- **Roles**: `POST /api/v1/users` stays `@Roles(['ADMIN'])`, and sign-up already enforces 12 through Better-Auth. Unauthenticated (401) and wrong-role (403) behaviour is unchanged.
- **Existing accounts**: passwords shorter than 12 that already exist keep working. A forced reset is out of scope, because there's no password-change flow yet.
- **Seed**: `seed.ts` inserts users directly with 8–10 character passwords for local development. It bypasses the DTO and stays as it is.

## Verification

New E2E cases in `test/controllers/users.e2e.spec.ts`, run with `pnpm test:e2e -- users`: an ADMIN posting an 11-character password gets 400 with no user created; an ADMIN posting a 12-character password gets 201 and the user can log in. A CLIENT gets 403 and an unauthenticated request gets 401. The full E2E run must stay green.
