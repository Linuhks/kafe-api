## Context

There are two account-creation paths. Better-Auth sign-up enforces `minPasswordLength: 12`. `POST /api/v1/users` validates with `CreateUserDto` (`@MinLength(8)`) and hashes with `better-auth/crypto` directly, so the Better-Auth length check never runs on it. At sign-in, Better-Auth doesn't check the length.

## Goals / Non-Goals

**Goals:** both creation paths require at least 12 characters.
**Non-Goals:** changing `LoginDto`, a password-change or forced-reset flow, changing seed passwords, other password-strength rules.

## Decisions

1. **Enforce it in the DTO (`@MinLength(12)`).** The password is not a domain concept here: hashing and storage belong to Better-Auth, and the use case only passes the password through. The DTO sits on the admin path, matching where Better-Auth enforces it on the sign-up path.
2. **Hard-code 12** instead of reading `auth.options`. Importing the Better-Auth config into a DTO would couple presentation to infrastructure. A comment next to the decorator points to `better-auth.ts`, so the two values stay in sync.
3. **`LoginDto` stays at `@MinLength(8)`.** Raising it would reject valid credentials of existing accounts before they ever reach Better-Auth.

## Risks / Trade-offs

- The two places holding 12 could drift apart. The comment mitigates that, and the E2E test on the admin path catches a regression.
- Clients of `POST /users` that send 8–11 character passwords start getting 400. That's intended, and the docs already say 12.

## Open Questions

None.
