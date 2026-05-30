# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

**Before starting any feature, refactoring, or bug fix**, read [`docs/workflow-dev.md`](docs/workflow-dev.md).

The mandatory gate after every **subtask** and every **task** — run in order:

```bash
pnpm lint    # Biome linter with auto-fix
pnpm check   # Biome full check (format + lint) with auto-fix
pnpm test    # Vitest unit tests
```

All three must pass before committing. One commit per subtask, one commit per completed task.

When a **task** is complete (not subtask), review and update affected docs before committing — see [`docs/workflow-dev.md`](docs/workflow-dev.md) for the full table.

---

## Commands

See [`docs/code-guide.md`](docs/code-guide.md) for the full command reference.

## Environment Setup

Copy `.env.example` to `.env`. Start PostgreSQL with `docker compose up -d`. Port 5432 (kafe/postgres/postgres).

## Architecture

NestJS API with clean architecture. Each layer has its own `CLAUDE.md` with detailed patterns.

```
src/
├── domain/                 # Core business rules — no framework deps (see src/domain/CLAUDE.md)
├── application/use-cases/  # Business logic orchestration (see src/application/use-cases/CLAUDE.md)
├── infrastructure/         # Drizzle ORM + Better-Auth (see src/infrastructure/CLAUDE.md)
├── presentation/           # HTTP layer: controllers, DTOs (see src/presentation/CLAUDE.md)
└── test/repositories/      # In-memory fakes for unit tests (see src/test/repositories/CLAUDE.md)
```

Feature modules (`users.module.ts`, `menu.module.ts`, `orders.module.ts`, `inventory.module.ts`, `dashboard.module.ts`) wire everything via NestJS DI: controllers → use cases → repository interface → Drizzle implementation.

Use case injection pattern (all modules follow this):
```typescript
{ provide: CreateUserUseCase, useFactory: (repo) => new CreateUserUseCase(repo), inject: [IUserRepository] }
```

## API

- Base path: `/api/v1`
- Swagger docs: `/api/v1/docs`
- Auth: `POST /api/v1/auth/login` → `{ token, user }`

## Database Schema

Drizzle + PostgreSQL. Tables: `categories`, `products`, `ingredients`, `product_ingredients`, `orders`, `order_items`, `inventory_movements`. Enums: `user_role` (ADMIN/BARISTA/CLIENT), `order_status` (RECEIVED/IN_PREPARATION/READY/DELIVERED/CANCELLED), `movement_type` (DEDUCTION/RESTOCK/ADJUSTMENT). Schema split: `schema.ts` (business) + `auth-schema.ts` (Better-Auth managed).
