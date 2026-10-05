# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

Rules in [`.claude/rules/`](.claude/rules/) (`workflow.md`, `code-style.md`, `testing.md`) are loaded automatically — follow them for every feature, refactor and bug fix. Non-trivial changes go through the OpenSpec flow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`, with artifacts under `openspec/changes/<name>/`.

## Commands

```bash
pnpm start:dev                       # dev server with hot reload → http://localhost:3333/api/v1
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

## Source of truth

| What | Where | Authority |
|---|---|---|
| Behavior / business rules (order state machine, stock deduction and refund, role permissions) | `openspec/specs/<capability>/spec.md` | **Normative.** Changed only through an OpenSpec change (`/opsx:propose` → `/opsx:archive` syncs the delta specs). |
| Index of the specs | [`docs/business-rules.md`](docs/business-rules.md) | Links only — no rules are restated there. Add a row when a new spec is created. |
| Endpoints, modules, architecture, how-to | `docs/API.md`, `docs/modules.md`, `docs/architecture.md`, `docs/code-guide.md` | Describe the code; the code wins on conflict. |
| Architectural invariants and workflow | this file + `.claude/rules/` + `src/<layer>/CLAUDE.md` | Rules for working in the repo. |
| Task tracking | `openspec/changes/<name>/tasks.md` | The only tracker. |

Implement the rules, don't redefine them. If code and spec disagree, that's a bug in one of them — surface it, don't pick silently.

## API

- Base path: `/api/v1` — Scalar API docs at `/api/v1/docs` (OpenAPI JSON at `/api/v1/docs-json`)
- Login: `POST /api/v1/auth/login` → `{ token, user }`, then `Authorization: Bearer <token>`
- Sign-up is a Better-Auth route **without** the `/v1` prefix: `POST /api/auth/sign-up/email` — always creates a `CLIENT`; role promotion happens via SQL or admin endpoint
- Controller decorators: `@Roles(['ADMIN'])`, `@AllowAnonymous()`, `@CurrentUser()`
- Global wiring in `main.ts`: ValidationPipe (whitelist + forbidNonWhitelisted), `HttpExceptionFilter`, `AuditInterceptor`, `ThrottlerGuard`, helmet. The app is created with `bodyParser: false` — Better-Auth needs the raw body; don't change it.

## Database

Drizzle + PostgreSQL. Schema is split in two files (both wired in `drizzle.config.ts`):

- `src/infrastructure/db/schema.ts` — business tables: `categories`, `products`, `ingredients`, `product_ingredients`, `orders`, `order_items`, `inventory_movements`. Edit freely; then generate, review, and apply a migration, and mirror the change in the corresponding in-memory fake.
- `src/infrastructure/db/auth-schema.ts` — Better-Auth managed (`user`, `session`, `account`, `verification`). **Never edit manually.**

`DrizzleService` exposes two instances: `db` (schema.ts) and `authDb` (auth-schema.ts) — each Drizzle repository picks one in its constructor. Multi-table writes go in `db.transaction(...)`. Enums: `user_role` (ADMIN/BARISTA/CLIENT), `order_status` (RECEIVED/IN_PREPARATION/READY/DELIVERED/CANCELLED), `movement_type` (DEDUCTION/RESTOCK/ADJUSTMENT). Production (`start:prod`) runs migrations before booting the API.
