## Context

Users are written through two paths:

1. **Better-Auth** (`POST /api/auth/sign-up/email`, plus sign-in through `POST /api/v1/auth/login`). Version 1.5.6 validates with `z.email()`, stores `email.toLowerCase()`, and looks users up with `findUserByEmail(email.toLowerCase())`. It does not trim.
2. **Admin** (`POST /api/v1/users`, `@Roles(['ADMIN'])`). `CreateUserDto` (`@IsEmail()`) → `CreateUserUseCase` → `DrizzleUserRepository.create`, which inserts into `user` + `account` directly. There is no normalization, and `findByEmail` uses `eq(userTable.email, email)`.

`user.email` is `text NOT NULL UNIQUE` (`auth-schema.ts`). The constraint is case-sensitive. The domain has entities, errors and repository interfaces, but no value objects yet.

## Goals / Non-Goals

**Goals:**
- The domain owns the email rule (format and normalization), whoever the caller is.
- The admin path stores exactly what Better-Auth stores, so every user can log in.
- Uniqueness is case-insensitive in practice.
- Establish a small, reusable value-object pattern.

**Non-Goals:**
- Changing `User.email` on the entity or in API responses (it stays `string`).
- A DB-level case-insensitive constraint (`citext` or a unique index on `lower(email)`). That would mean touching the Better-Auth-managed table schema.
- Changing how Better-Auth validates on its own routes.
- Email verification, changing an email, or full RFC 5322 parsing.
- Merging existing accounts that collide by case.

## Decisions

1. **`Email` value object in `src/domain/value-objects/email.ts`.** It has a private constructor, a `readonly value: string`, `static create(raw: string): Either<InvalidEmailError, Email>`, and `equals(other)`. `create` trims, lowercases, then validates. A new `value-objects/` folder (rather than `entities/`) marks the distinction: identity-less, always valid, compared by value. The file name follows the kebab-case convention with no suffix (`email.ts` → `Email`), and the convention is recorded in `src/domain/CLAUDE.md`.

2. **The format check is deliberately simple.** The check: at most 254 characters after trimming, no whitespace, exactly one `@`, a non-empty local part, and a domain containing a `.` with non-empty labels. The regex is `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` plus the length check. `@IsEmail()` and `z.email()` stay stricter at the edges. The VO guarantees the invariants the domain relies on (normalized, unambiguous) and does not reimplement a validator library. The domain must stay dependency-free, so class-validator cannot be used here.

3. **New `InvalidEmailError(email)`**, a `DomainError` subclass with `INVALID_EMAIL` and 400, in `domain.error.ts`. The message doesn't echo the raw input, so logs don't collect garbage or PII.

4. **The VO is used at the repository boundary; the entity field stays `string`.**
   - `CreateUserData.email: Email` and `findByEmail(email: Email)`. Repositories can't be handed a raw string, which the type system enforces in both the Drizzle repository and the fake.
   - The use case input becomes `CreateUserInput { name; email: string; password; role }`, exported from the use case file. The controller still passes the DTO, which matches this shape. The use case calls `Email.create`, propagates the `Left` as-is, then calls `findByEmail(email)` and `create({ ...input, email })`.
   - Repositories write and query `email.value`.
   - `User.email` stays `string`. Wrapping it on read would force `mapToUser` to handle a `Left` for rows written before this change and would change response serialization. Every write path now produces normalized values, and the migration (decision 6) fixes historical rows.

5. **No DB-level case-insensitive constraint.** `user` belongs to Better-Auth. Adding `citext` or a `lower(email)` unique index means diverging from the generated schema. With both write paths normalizing, the existing `UNIQUE` constraint is effectively case-insensitive. A future change can revisit this through the Better-Auth CLI.

6. **Custom data migration** created with `pnpm drizzle-kit generate --custom --name=normalize_user_email --config=drizzle.config.ts`:
   ```sql
   UPDATE "user" u
   SET email = lower(trim(u.email)), updated_at = now()
   WHERE u.email <> lower(trim(u.email))
     AND NOT EXISTS (
       SELECT 1 FROM "user" o
       WHERE o.id <> u.id AND lower(trim(o.email)) = lower(trim(u.email))
     );
   ```
   This fixes the accounts that currently can't log in, and skips (does not merge) any group that collides by case. Colliding rows must be resolved by hand, so the PR notes a query to list them. The migration is idempotent and changes no schema. If the generated journal entry or the column name (`updated_at`) differs, follow what drizzle-kit produced and verify against `auth-schema.ts`.

7. **Vitest include.** `src/domain/value-objects/` is added to `vitest.config.ts`, and `.claude/rules/testing.md` lists it.

## Risks / Trade-offs

- **A stricter domain check than before**: an address that passes `@IsEmail()` would only fail the VO if it had no dot in the domain (`a@localhost`). `@IsEmail()` already rejects that by default, so there is no behaviour change through the API.
- **Seed** (`seed.ts`) inserts users directly with lowercase literals. Its output is unaffected, so it stays out of scope.
- **Colliding historical rows** stay mixed-case and still can't log in. They're surfaced in the PR instead of being auto-resolved, because merging accounts is unsafe.
- **Better-Auth doesn't trim** on sign-up. A sign-up with surrounding spaces is rejected by `z.email()` anyway, so the two paths stay consistent.

## Open Questions

None.
