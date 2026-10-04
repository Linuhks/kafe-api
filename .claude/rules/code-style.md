# Code style

Conventions for every file under `src/`. Step-by-step walkthroughs live in `docs/code-guide.md`.

## Non-negotiable patterns

- **Either, never throw.** Use cases return `Either<DomainError, T>` (`src/domain/either.ts`); domain errors are returned as `left(...)`. Controllers unwrap with `if (result.isLeft()) throw result.value;` and `HttpExceptionFilter` maps `DomainError.statusCode`/`code` to the HTTP response. When composing use cases, propagate the `Left` as-is — never re-wrap.
- **Use cases are framework-free.** No `@Injectable()`, no `@nestjs/*` imports. Modules wire them with `useFactory`:
  ```typescript
  { provide: CreateUserUseCase, useFactory: (repo) => new CreateUserUseCase(repo), inject: [IUserRepository] }
  ```
- **Repository interfaces are `abstract class`** (NestJS needs a runtime DI token), registered as `{ provide: IUserRepository, useClass: DrizzleUserRepository }`.
- **No `any`.** Declare explicit types, or use `unknown` and narrow:
  ```typescript
  // ❌ const result: any = await repo.findById(id);
  // ✅ const result: Order | null = await repo.findById(id);
  error: (err: unknown) => {
    const statusCode = err instanceof HttpException ? err.getStatus() : 500;
  }
  ```

## Naming

All files **kebab-case**, all classes **PascalCase**.

| Type | Suffix | Example |
|---|---|---|
| Domain entity | `.entity.ts` | `order.entity.ts` → `Order` |
| Repository interface | `.repository.ts` | `user.repository.ts` → `IUserRepository` |
| Use case | `.use-case.ts` | `create-user.use-case.ts` → `CreateUserUseCase` |
| Drizzle implementation | `drizzle-<name>.repository.ts` | `DrizzleUserRepository` |
| Test fake | `in-memory-<name>.repository.ts` | `InMemoryUserRepository` |
| Controller | `.controller.ts` | `users.controller.ts` → `UsersController` |
| DTO | `.dto.ts` | `create-user.dto.ts` → `CreateUserDto` |
| Module | `.module.ts` (in `src/modules/`) | `users.module.ts` → `UsersModule` |

## Layer rules

**Domain (`src/domain/`)**
- No imports from `@nestjs/*`, `drizzle-orm`, `better-auth`, or any infrastructure.
- Entities are immutable — every field `readonly`, set only via the constructor.
- Domain errors extend `DomainError` and set both `code` and `statusCode`.
- Input data types (`CreateXxxData`, `UpdateXxxData`) live alongside the repository interface, not in entities.

**Application (`src/application/use-cases/`)**
- Depends only on repository interfaces (`IXxxRepository`), never on `DrizzleXxxRepository`.
- One class per use case, a single `execute()`.

**Infrastructure (`src/infrastructure/`)**
- Drizzle repository `extends` the abstract interface; DB rows are mapped to entities via a local `mapToXxx()`.
- Multi-table writes go in `db.transaction(async (tx) => ...)`.
- `drizzleService.db` for business tables (`schema.ts`), `drizzleService.authDb` for auth tables. Never edit `auth-schema.ts` manually.
- A `schema.ts` edit comes with a generated migration in `src/infrastructure/db/migrations/` and a matching change in the in-memory fake.

**Presentation (`src/presentation/`)**
- Controllers inject **use cases**, never repositories.
- DTOs use `class-validator` plus `@ApiProperty` / `@ApiPropertyOptional` for Swagger.
- Success values are returned as-is (no global envelope); pagination envelopes are built manually; `HttpExceptionFilter` formats errors.
- Access control via `@Roles([...])` / `@AllowAnonymous()`; the authenticated user via `@CurrentUser()`.
