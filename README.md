# kafe-api

REST API for **Kafe** — a coffee shop management system with order tracking, menu, ingredients, and inventory control.

## About

Kafe is a backend platform for coffee shop management, supporting multiple user roles (admin, barista, and client). The API covers the full order lifecycle: creation, status tracking, ingredient stock control, and dashboard reporting.

Built with Clean Architecture, separating domain, use cases, infrastructure, and the HTTP layer.

## Features

- Authentication with session management and role-based access control (ADMIN / BARISTA / CLIENT)
- Category and product management for the menu
- Order creation and status tracking
- Ingredient stock control with movements (deduction, restock, adjustment)
- Dashboard with operational metrics
- Interactive documentation via Swagger

## Tech stack

**Runtime and framework**
- Node.js 22 + TypeScript 5
- NestJS 11

**Database**
- PostgreSQL (`bitnami/postgresql` image)
- Drizzle ORM — type-safe schema, automatic migrations in production
- Drizzle Studio — browser UI to inspect the database in development

**Authentication**
- Better Auth via `@thallesp/nestjs-better-auth`

**Validation and documentation**
- class-validator / class-transformer
- Swagger / OpenAPI (`@nestjs/swagger`)

**Security**
- Helmet (HTTP headers)
- Rate limiting via `@nestjs/throttler`
- CORS configurable via environment variable

**Code quality**
- Biome (linter + formatter)
- Vitest (unit tests)
- Husky (git hooks)

**Infrastructure**
- Docker + Docker Compose (local PostgreSQL)
- Multi-stage Dockerfile with Node 22 Alpine

## Structure

```
src/
├── domain/                 # Entities, business rules, repository interfaces
├── application/use-cases/  # Use cases (business logic orchestration)
├── infrastructure/         # Drizzle ORM, Better-Auth, repository implementations
├── presentation/           # Controllers, DTOs, filters, interceptors
└── test/repositories/      # In-memory fakes for unit tests
```

## Setup

Copy the environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
pnpm install
```

Start the database:

```bash
docker compose up -d
```

## Running

```bash
# development with hot reload
pnpm run start:dev

# production (runs migrations then starts the API)
pnpm run start:prod
```

API available at `http://localhost:3000/api/v1`.  
Swagger docs at `http://localhost:3000/api/v1/docs`.

## Database

```bash
# create a new migration
pnpm run db:migrate

# open Drizzle Studio
pnpm run db:studio

# seed with sample data
pnpm run seed
```

In production, migrations run automatically before the API starts.

## Tests

```bash
# unit tests
pnpm run test

# watch mode
pnpm run test:watch

# coverage
pnpm run test:cov
```

## License

Private — all rights reserved.
