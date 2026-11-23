# Tasks

## 1. Domain: Email value object

- [x] 1.1 Add `InvalidEmailError` (`INVALID_EMAIL`, 400, message without the raw input) to `src/domain/errors/domain.error.ts` and a case in `domain.error.spec.ts`. Verify with `pnpm test -- domain.error`.
- [x] 1.2 Create `src/domain/value-objects/email.ts` (private constructor, `readonly value`, `static create(raw): Either<InvalidEmailError, Email>`, `equals`) with a sibling `email.spec.ts` covering: trim + lowercase; rejections for empty, no `@`, two `@`, empty local part, domain without a dot, inner whitespace, more than 254 characters. Add `src/domain/value-objects/**/*.spec.ts` to `test.include` and `src/domain/value-objects/**` to `coverage.include` in `vitest.config.ts`. Verify with `pnpm test -- email`.

## 2. Use case and repositories

- [ ] 2.1 Change `IUserRepository`: `CreateUserData.email: Email`, `findByEmail(email: Email)`. Update `DrizzleUserRepository` (writes and queries `email.value`) and `test/repositories/in-memory-user.repository.ts` to match. Check the Drizzle docs on Context7 for the installed version before touching the query.
- [ ] 2.2 Update `CreateUserUseCase`: add an exported `CreateUserInput` with a raw `email: string`, build the `Email` and propagate `Left(InvalidEmailError)` as-is, then run the conflict check and create with the normalized value. Update the return type to `Either<InvalidEmailError | ConflictError, User>`. Extend `create-user.use-case.spec.ts`: invalid email → Left with nothing persisted; `  Ana@Example.com ` is stored as `ana@example.com`; a case-variant duplicate → `ConflictError`. Confirm `UsersController` still compiles with the DTO as input. Verify with `pnpm test`.

## 3. Data migration

- [ ] 3.1 Generate a custom migration with `pnpm drizzle-kit generate --custom --name=normalize_user_email --config=drizzle.config.ts` and fill it with the collision-safe `UPDATE "user"` from design.md (check the column names against `auth-schema.ts`). Review the SQL and journal entry. Apply it locally with `pnpm db:migrate` against a DB that has one mixed-case user and one colliding pair, and confirm only the non-colliding row changed.

## 4. E2E

- [ ] 4.1 Add cases to `test/controllers/users.e2e.spec.ts` for `POST /api/v1/users`: ADMIN creates `Maria.Case@Kafe.com` → 201 with email `maria.case@kafe.com`; that user logs in via `POST /api/v1/auth/login` with both lower and upper case → 200; a case-variant duplicate → 409; a CLIENT → 403; no token → 401. Verify with `pnpm test:e2e -- users` and `pnpm test:e2e -- auth` (requires `docker compose up -d`).

## 5. Docs and gate

- [ ] 5.1 Update `src/domain/CLAUDE.md` (a value objects section: `value-objects/`, `static create` returning `Either`, always valid, entity fields stay primitives), `docs/architecture.md` (value objects in the domain layer), `docs/modules.md` (`Email`, `InvalidEmailError`), `.claude/rules/testing.md` (new Vitest include path), and `docs/business-rules.md` (index row for `user-email`). Run the `security-review` skill on the diff.
- [ ] 5.2 Run the full gate `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e` and confirm all pass. In the PR body, list the query to find leftover case-colliding rows: `SELECT lower(trim(email)), array_agg(email) FROM "user" GROUP BY 1 HAVING count(*) > 1;`.
