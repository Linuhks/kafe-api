# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

**Before starting any feature, refactoring, or bug fix**, read [`docs/workflow-dev.md`](docs/workflow-dev.md). Non-trivial changes go through the OpenSpec flow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`, with artifacts under `openspec/changes/<name>/`.

The mandatory gate after every **subtask** and every **task** — run in order:

```bash
pnpm lint    # Biome linter with auto-fix
pnpm check   # Biome full check (format + lint) with auto-fix
pnpm test    # Vitest unit tests
```

All three must pass before committing. One commit per subtask, one commit per completed task.

Husky hooks: pre-commit runs `pnpm check`; pre-push runs `pnpm test` **and** `pnpm test:e2e` — pushing requires PostgreSQL running (`docker compose up -d`).

When a **task** is complete (not subtask), review and update affected docs before committing — see [`docs/workflow-dev.md`](docs/workflow-dev.md) for the full table.

## Commands

```bash
pnpm start:dev                       # dev server with hot reload → http://localhost:3000/api/v1
pnpm test                            # unit tests
pnpm test -- path/to/file.spec.ts    # single unit test file
pnpm test:e2e                        # E2E suites (requires docker compose up -d)
pnpm test:e2e -- orders              # single E2E suite
pnpm seed                            # seed sample data
pnpm db:studio                       # Drizzle Studio (browser DB UI)
pnpm drizzle-kit generate --config=drizzle.config.ts   # generate migration after editing schema.ts
pnpm db:migrate                      # apply migrations
```

Full reference: [`docs/code-guide.md`](docs/code-guide.md) — step-by-step walkthroughs for adding a use case, a feature module, a schema migration, and an E2E test.

## Environment Setup

Copy `.env.example` to `.env`. `docker compose up -d` starts PostgreSQL (port 5432, db `kafe`, postgres/postgres) and Redis (port 6379). Cache falls back to in-memory when `REDIS_URL` is unset.

## Architecture

NestJS API with clean architecture. Each `src/` layer has its own `CLAUDE.md` with detailed patterns.

```
src/
├── domain/                 # Entities, Either, repo interfaces, errors — no framework deps (src/domain/CLAUDE.md)
├── application/use-cases/  # One class per use case, single execute() (src/application/use-cases/CLAUDE.md)
├── infrastructure/         # Drizzle ORM + Better-Auth (src/infrastructure/CLAUDE.md)
├── presentation/           # Controllers, DTOs, filters, interceptors (src/presentation/CLAUDE.md)
└── modules/                # NestJS module wiring, one per feature (src/modules/<name>.module.ts)
test/
├── repositories/           # In-memory fakes for unit tests — imported via the @test/* alias
├── controllers/            # E2E suites (<resource>.e2e.spec.ts)
└── helpers/                # E2ETestHelper + global setup
```

Feature modules in `src/modules/` (`auth`, `users`, `menu`, `orders`, `inventory`, `dashboard` — `src/modules/<name>.module.ts`) wire everything via NestJS DI: controller → use cases → repository interface → Drizzle implementation.

Non-negotiable patterns:

- **Either, never throw**: use cases return `Either<DomainError, T>` (`src/domain/either.ts`); domain errors are returned as `left(...)`. Controllers unwrap with `if (result.isLeft()) throw result.value;` — `HttpExceptionFilter` maps `DomainError.statusCode`/`code` to the HTTP response. When composing use cases, propagate the `Left` as-is, never re-wrap.
- **Use cases are framework-free**: no `@Injectable()`, no `@nestjs/*` imports. Modules wire them with `useFactory`:
  ```typescript
  { provide: CreateUserUseCase, useFactory: (repo) => new CreateUserUseCase(repo), inject: [IUserRepository] }
  ```
- **Repository interfaces are `abstract class`** (NestJS needs a runtime DI token), registered as `{ provide: IUserRepository, useClass: DrizzleUserRepository }`.
- **Every use case has a sibling `.spec.ts`** tested against in-memory fakes — no DB, no NestJS bootstrap.
- **No `any`** — explicit types, or `unknown` + narrowing.

Business rules (order state machine, stock deduction on `RECEIVED → IN_PREPARATION`, role permissions) are specified in [`docs/business-rules.md`](docs/business-rules.md) — implement them, don't redefine them.

## Testing

- Vitest only picks up unit specs under `src/application/use-cases/`, `src/domain/errors/`, and `src/presentation/filters/` (see `vitest.config.ts`).
- Fakes live in `test/repositories/` (`InMemory*Repository` extending the abstract interface, public `items` array for assertions), imported via `@test/repositories/...`.
- Each E2E suite creates a fresh `kafe_test_<uuid>` database, migrates it, boots the full `AppModule`, and drops the DB on teardown even when tests fail. Requires `CREATEDB` privilege and PostgreSQL ≥ 13.

## API

- Base path: `/api/v1` — Swagger docs at `/api/v1/docs`
- Login: `POST /api/v1/auth/login` → `{ token, user }`, then `Authorization: Bearer <token>`
- Sign-up is a Better-Auth route **without** the `/v1` prefix: `POST /api/auth/sign-up/email` — always creates a `CLIENT`; role promotion happens via SQL or admin endpoint
- Controller decorators: `@Roles(['ADMIN'])`, `@AllowAnonymous()`, `@CurrentUser()`
- Global wiring in `main.ts`: ValidationPipe (whitelist + forbidNonWhitelisted), `HttpExceptionFilter`, `AuditInterceptor`, `ThrottlerGuard`, helmet. The app is created with `bodyParser: false` — Better-Auth needs the raw body; don't change it.

## Database

Drizzle + PostgreSQL. Schema is split in two files (both wired in `drizzle.config.ts`):

- `src/infrastructure/db/schema.ts` — business tables: `categories`, `products`, `ingredients`, `product_ingredients`, `orders`, `order_items`, `inventory_movements`. Edit freely; then generate, review, and apply a migration, and mirror the change in the corresponding in-memory fake.
- `src/infrastructure/db/auth-schema.ts` — Better-Auth managed (`user`, `session`, `account`, `verification`). **Never edit manually.**

`DrizzleService` exposes two instances: `db` (schema.ts) and `authDb` (auth-schema.ts) — each Drizzle repository picks one in its constructor. Multi-table writes go in `db.transaction(...)`. Enums: `user_role` (ADMIN/BARISTA/CLIENT), `order_status` (RECEIVED/IN_PREPARATION/READY/DELIVERED/CANCELLED), `movement_type` (DEDUCTION/RESTOCK/ADJUSTMENT). Production (`start:prod`) runs migrations before booting the API.
