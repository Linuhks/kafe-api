# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm run start:dev        # Start with hot reload
pnpm run build            # Compile TypeScript

# Testing
pnpm run test             # Run unit tests
pnpm run test:watch       # Watch mode
pnpm run test:cov         # With coverage
pnpm run test:e2e         # End-to-end tests
pnpm run test -- path/to/file.spec.ts  # Single file

# Code quality
pnpm run lint             # ESLint with auto-fix
pnpm run format           # Prettier

# Database
pnpm run seed             # Seed database
pnpm run db:studio        # Open Drizzle Studio (browser UI)
```

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
