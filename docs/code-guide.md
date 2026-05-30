# Code Guide

Conventions, patterns, and contribution flow for `kafe-api`.

---

## Development commands

```bash
pnpm run start:dev     # Start the API with hot reload (watch mode)
pnpm run build         # Compile TypeScript to dist/

pnpm run test          # Run unit tests
pnpm run test:watch    # Tests in watch mode
pnpm run test:cov      # Tests with coverage report
pnpm run test:e2e      # End-to-end tests

pnpm run lint          # Biome linter with auto-fix
pnpm run format        # Biome formatter

pnpm run seed          # Seed the database with sample data
pnpm run db:studio     # Open Drizzle Studio in the browser (database UI)
```

Prerequisite: `docker compose up -d` to start PostgreSQL (port 5432).

---

## Dependency injection pattern

Use cases **do not use** NestJS's `@Injectable()`. They are manually instantiated via `useFactory` inside the module.

```typescript
// ✅ Correct
{
  provide: CreateUserUseCase,
  useFactory: (repo: IUserRepository) => new CreateUserUseCase(repo),
  inject: [IUserRepository],
}

// ❌ Avoid — use cases must not depend on the NestJS container
@Injectable()
export class CreateUserUseCase { ... }
```

Repositories follow the opposite pattern: the interface is registered with `useClass` pointing to the Drizzle implementation.

```typescript
{ provide: IUserRepository, useClass: DrizzleUserRepository }
```

---

## Naming conventions

| Type | Suffix | Example |
|---|---|---|
| Domain entity | `.entity.ts` | `order.entity.ts` → `Order` |
| Repository interface | `.repository.ts` | `user.repository.ts` → `IUserRepository` |
| Use case | `.use-case.ts` | `create-user.use-case.ts` → `CreateUserUseCase` |
| Drizzle implementation | `drizzle-<name>.repository.ts` | `DrizzleUserRepository` |
| Test fake | `in-memory-<name>.repository.ts` | `InMemoryUserRepository` |
| Controller | `.controller.ts` | `users.controller.ts` → `UsersController` |
| DTO | `.dto.ts` | `create-user.dto.ts` → `CreateUserDto` |
| Module | `.module.ts` | `users.module.ts` → `UsersModule` |

All files: **kebab-case**. All classes: **PascalCase**.

---

## Where to create each file type

```
src/
├── domain/
│   ├── entities/          ← new business entities
│   ├── repositories/      ← new repository interfaces
│   └── errors/            ← new typed domain errors
│
├── application/use-cases/
│   └── <module>/          ← new use cases (e.g. menu/, orders/)
│
├── infrastructure/
│   └── db/repositories/   ← Drizzle repository implementations
│
├── presentation/
│   ├── controllers/       ← new HTTP controllers
│   └── dtos/              ← input and output DTOs
│
└── test/repositories/     ← in-memory fakes for unit tests
```

---

## Flow for adding a feature

1. **Domain**: create/update the entity and repository interface
2. **Application**: create the use case in `use-cases/<module>/`
3. **Infrastructure**: implement the Drizzle repository (if new)
4. **Test**: create the in-memory fake in `src/test/repositories/`
5. **Presentation**: create the DTO and add the endpoint to the controller
6. **Module**: register the use case and repository in the feature's `.module.ts`

---

## Unit tests

Use cases are tested with in-memory repositories (no real database). The fake implements the same interface as the Drizzle repository.

```typescript
const repo = new InMemoryUserRepository();
const useCase = new CreateUserUseCase(repo);

const result = await useCase.execute({ name: 'John', email: 'john@kafe.com', role: 'CLIENT' });
expect(result.name).toBe('John');
```

Each use case must have a sibling `.spec.ts` file in the same directory.

---

## Database

- ORM: **Drizzle** with PostgreSQL
- Schema in `src/infrastructure/db/schema.ts` (business tables)
- Auth schema in `src/infrastructure/db/auth-schema.ts` (managed by Better-Auth)
- Migrations: generated and applied via the Drizzle CLI

---

## Authentication

Managed by **Better-Auth**. The JWT token is obtained via `POST /api/v1/auth/login` and sent in the `Authorization: Bearer <token>` header. Access control guards and decorators live in `src/presentation/`.
