# Tasks

## 1. Enforce the minimum on admin creation

- [x] 1.1 Change `CreateUserDto.password` to `@MinLength(12)`, with `@ApiProperty` `minLength: 12`, a 12+ character example and a comment pointing to `minPasswordLength` in `better-auth.ts`. Check the class-validator docs on Context7 for the installed version. Verify with `pnpm lint && pnpm check && pnpm test`.
- [x] 1.2 Add E2E cases to `test/controllers/users.e2e.spec.ts` for `POST /api/v1/users`: 11 characters → 400 with no user created; 12 characters → 201 and login works; CLIENT → 403; no token → 401. Verify with `pnpm test:e2e` (requires `docker compose up -d`).

## 2. Docs and gate

- [x] 2.1 Confirm `docs/API.md` (already 12) and the Swagger annotation agree, and add the `auth-access-control` row wording to `docs/business-rules.md` if needed. Run the `security-review` skill on the diff.
- [x] 2.2 Run the full gate `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e` and confirm all pass.
