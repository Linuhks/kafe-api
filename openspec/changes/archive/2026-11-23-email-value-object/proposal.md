# Proposal

## Why

`User.email` is a plain `string` and the domain enforces no rule on it. Today the format is only checked by `@IsEmail()` in the DTOs and by Better-Auth on its own routes. Anything that calls `CreateUserUseCase` directly accepts any string.

There is also a real bug. Better-Auth 1.5.6 lowercases the email on sign-up and when it looks a user up at sign-in (`internalAdapter.findUserByEmail` queries `email.toLowerCase()`). Our admin path `POST /api/v1/users` → `CreateUserUseCase` → `DrizzleUserRepository.create` stores the email as typed, and `findByEmail` compares it exactly with `eq`. As a result:

- A user an admin creates as `Maria@kafe.com` is stored mixed-case. Their login is looked up as `maria@kafe.com` and never matches, so they can never log in.
- The conflict check in `CreateUserUseCase` treats `Maria@kafe.com` and `maria@kafe.com` as different emails. The `UNIQUE` constraint on `user.email` is case-sensitive too, so two accounts that differ only by case can coexist.

## What Changes

- New domain value object `Email` (`src/domain/value-objects/email.ts`), the first value object in the codebase. `Email.create(raw)` returns `Either<InvalidEmailError, Email>`. It trims, lowercases, and does a simple format check: one `@`, non-empty local part, a domain with a dot, no whitespace, at most 254 characters.
- New `InvalidEmailError` (`INVALID_EMAIL`, 400) in `domain.error.ts`.
- `CreateUserUseCase` builds an `Email` from its input and returns `Left(InvalidEmailError)` when the email is invalid. The conflict check and the insert both use the normalized value.
- `IUserRepository.findByEmail` takes an `Email`, and `CreateUserData.email` becomes an `Email`. Repositories can no longer receive an unnormalized string. The use case input is a separate raw type.
- A data migration lowercases and trims existing `user.email` values so accounts created mixed-case can log in again. Rows that would collide are left untouched.
- `@IsEmail()` stays in the DTOs as the first barrier. The API response shape does not change.

## Capabilities

### New Capabilities
- `user-email`: email validity and normalization rules for user accounts (format, case-insensitive uniqueness, stored lowercase, login works regardless of case at creation).

### Modified Capabilities
None. `auth-access-control` stays as is (roles, server-assigned fields, deactivated users).

## Impact

- Code: new `src/domain/value-objects/email.ts` with a sibling spec; `InvalidEmailError`; `CreateUserUseCase`, `IUserRepository`, `DrizzleUserRepository`, `InMemoryUserRepository`; `UsersController` passes the raw DTO as before.
- Vitest config: add `src/domain/value-objects/` to the include list so the VO spec runs.
- DB: one custom data-only migration (`UPDATE "user"`), no schema change. `auth-schema.ts` is not edited.
- API: no contract change. An invalid email that somehow gets past the DTO now returns 400 `INVALID_EMAIL`, and a case-variant duplicate returns 409 instead of creating a second account.
- Docs: `src/domain/CLAUDE.md` (value-object pattern), `docs/architecture.md` (value objects in the domain layer), `docs/modules.md`, `docs/business-rules.md` (index row for `user-email`), `.claude/rules/testing.md` (new Vitest include path).

## Security Considerations

- **Client-writable fields**: `email` was already client-writable, by the admin through `POST /users` and by anyone through Better-Auth sign-up. This change only restricts and normalizes it. No new field becomes writable.
- **Roles**: `POST /api/v1/users` stays `@Roles(['ADMIN'])`. The Better-Auth sign-up route is unchanged and already normalizes. No new endpoint.
- **Unauthenticated / wrong role / deactivated**: they reach nothing new. `POST /users` without a token stays 401 and a CLIENT stays 403. A deactivated user's lookup behaviour is unchanged, and the `isActive` check still applies at session creation.
- **Account confusion**: case-insensitive uniqueness closes the case where `Admin@kafe.com` and `admin@kafe.com` could be two different accounts. Login can only ever resolve one of them, which made the other a confusing shadow account.
- **Migration**: rows whose normalized email already exists are left untouched rather than merged, so no account is silently taken over.

## Verification

- Unit: `email.spec.ts` covers normalization and rejections. `create-user.use-case.spec.ts` covers the invalid email Left, a case-variant duplicate returning 409, and the stored lowercase value.
- E2E: `pnpm test:e2e -- users` with new cases: admin creates `Maria.Case@Kafe.com`, the response email is `maria.case@kafe.com`, and that user logs in through `POST /api/v1/auth/login` with both mixed and lower case; a case-variant duplicate returns 409; a CLIENT gets 403 and an unauthenticated request gets 401. `pnpm test:e2e -- auth` must stay green.
- Migration: applied in the fresh E2E database for every suite. Also reviewed manually against a local DB seeded with one mixed-case user and one colliding pair.
