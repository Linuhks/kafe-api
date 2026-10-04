---
name: backend-patterns
description: Backend patterns for kafe-api (NestJS 11, clean architecture, Either, Drizzle + PostgreSQL, Better-Auth, cache-manager). Use when adding or reviewing use cases, controllers, repositories, modules, transactions, caching, auth or error handling in this repo.
metadata:
  origin: ECC (rewritten for kafe-api)
---

# kafe-api Backend Patterns

NestJS API with clean architecture. This skill summarizes the patterns the code **already uses**; the source of truth is `CLAUDE.md`, the per-layer `src/*/CLAUDE.md`, and `docs/code-guide.md` (step-by-step walkthroughs). If this skill and the code disagree, the code wins — fix the skill.

For the HTTP contract (status codes, pagination shape) see `api-design`; for schema/index/migration work see `postgres-patterns` and `database-migrations`; for abuse review see `security-review`.

## When to Activate

- Adding or changing a use case, controller, DTO, repository, or feature module
- Composing use cases or making a multi-table write atomic
- Adding caching, auth/role rules, or error types
- Reviewing backend code for layer violations

## Layers and dependency direction

```
presentation (controllers, DTOs, filters)  ─┐
modules (NestJS DI wiring)                  ├─►  application/use-cases  ─►  domain
infrastructure (Drizzle, Better-Auth)      ─┘      (no framework)          (no framework)
```

- `domain/`: entities (immutable, `readonly`), `Either`, `DomainError`s, repository **abstract classes**. No NestJS, no Drizzle.
- `application/use-cases/<feature>/<action>-<resource>.use-case.ts`: one class, one `execute()`. Only domain imports.
- `infrastructure/`: `Drizzle*Repository`, `DrizzleService`, `DrizzleUnitOfWork`, Better-Auth config.
- `presentation/`: controllers inject **use cases, never repositories**.
- `modules/<feature>.module.ts`: the only place that wires everything.

## Use case: Either, never throw

```typescript
export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: CreateUserData): Promise<Either<ConflictError, User>> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) return left(new ConflictError('Email already in use'));
    return right(await this.userRepo.create(data));
  }
}
```

- No `@Injectable()`, no `@nestjs/*` imports. Domain failures are `left(new XxxError(...))`.
- Composing use cases: propagate the `Left` as-is, never re-wrap.
  ```typescript
  const r = await this.deductForOrder.execute(order);
  if (r.isLeft()) return left(r.value);
  ```
- Every use case has a sibling `.spec.ts` using `InMemory*Repository` from `test/repositories/` (`@test/*` alias). No DB, no Nest bootstrap.
- No `any`: explicit types, or `unknown` + narrowing.

## Errors

`DomainError(message, code, statusCode)` in `domain/errors/domain.error.ts`. Existing: `NotFoundError(resource)` 404, `ConflictError(msg)` 409, `InvalidOrderTransitionError` 400, `InsufficientStockError` 400. Add new ones as subclasses there (with a spec), don't invent status handling elsewhere.

`HttpExceptionFilter` (global) turns errors into:

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": [...], "timestamp": "...", "path": "..." } }
```

Controllers just unwrap: `if (result.isLeft()) throw result.value;` — never build error responses by hand.

## Module wiring

Repositories are `abstract class` tokens bound with `useClass`; use cases are built with `useFactory`:

```typescript
providers: [
  { provide: IOrderRepository, useClass: DrizzleOrderRepository },
  { provide: IUnitOfWork, useClass: DrizzleUnitOfWork },
  {
    provide: UpdateOrderStatusUseCase,
    useFactory: (repo: IOrderRepository, uow: IUnitOfWork) => new UpdateOrderStatusUseCase(repo, uow),
    inject: [IOrderRepository, IUnitOfWork],
  },
],
exports: [IOrderRepository],
```

Share across features by exporting the repository token and importing the module (e.g. `OrdersModule` imports `MenuModule`); don't re-provide the same repository in two modules.

## Controllers and DTOs

```typescript
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly updateOrderStatus: UpdateOrderStatusUseCase) {}

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(['BARISTA', 'ADMIN'])
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: UserSession<Auth> | undefined,
  ): Promise<Order> {
    const result = await this.updateOrderStatus.execute(id, dto.status, user?.user.id);
    if (result.isLeft()) throw result.value;
    return result.value;
  }
}
```

- Base path `/api/v1`. No global response envelope: return the value as-is.
- Lists: `{ data, pagination: { page, limit, total, totalPages } }` built in the controller; query DTO extends `PaginationDto`; document with `@ApiPaginatedResponse(Dto)`.
- Auth decorators: `@Roles([...])` (from `presentation/decorators`), `@AllowAnonymous()`, `@CurrentUser()`. Roles: `ADMIN`, `BARISTA`, `CLIENT`.
- DTOs: class-validator + `@ApiProperty`/`@ApiPropertyOptional` on every field. The global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted`, so undeclared fields are rejected.
- Don't touch `bodyParser: false` in `main.ts` (Better-Auth needs the raw body).

## Repositories (Drizzle)

```typescript
@Injectable()
export class DrizzleOrderRepository extends IOrderRepository {
  constructor(private readonly drizzleService: DrizzleService) { super(); }

  private get db() { return this.drizzleService.db; }   // getter, NOT a field
}
```

- Use a `private get db()` — `drizzleService.db` returns the active transaction when inside a unit of work. Caching it in a constructor field would silently bypass the transaction.
- Business tables → `drizzleService.db` (`schema.ts`). Auth tables → `drizzleService.authDb` (`auth-schema.ts`, never edit by hand).
- Always map rows to entities through a local `mapTo<Entity>()`; never leak `$inferSelect` rows out of the repo.
- Avoid N+1: batch with `inArray` and group in a `Map` (see `loadItemsForOrders`); run independent queries with `Promise.all` (see `findAll`: rows + count).
- Concurrency-safe transitions use a conditional update and return `null` on no match (`transitionStatus` filters `status = from`); the use case turns `null` into `ConflictError`.
- After changing `schema.ts`: `pnpm drizzle-kit generate --config=drizzle.config.ts`, review the SQL, `pnpm db:migrate`, and mirror the change in the in-memory fake.

## Transactions: IUnitOfWork, not db.transaction in use cases

Use cases can't import Drizzle, so atomic multi-repo writes go through `IUnitOfWork`:

```typescript
return this.unitOfWork.run<DomainError, Order>(async () => {
  const updated = await this.orderRepo.transitionStatus(id, order.status, newStatus);
  if (!updated) return left(new ConflictError('Order status was changed by another request'));
  const deducted = await this.deductForOrder.execute(order);
  if (deducted.isLeft()) return left(deducted.value);   // Left => rollback
  return right(updated);
});
```

A `Left` (or thrown error) rolls back everything inside. `runInTransaction` is re-entrant, so nested use cases are safe. Plain `db.transaction(...)` is only for repository-internal writes (e.g. `DrizzleUserRepository.create`, seed).

## Caching

`@nestjs/cache-manager` (in-memory, Redis when `REDIS_URL` is set). Pattern used for the product list: cache in the controller, build the key from sorted query params, invalidate on every write.

```typescript
const key = buildProductListKey(query as unknown as Record<string, unknown>);
const cached = await this.cacheManager.get<ProductList>(key);
if (cached) return cached;
// ... execute use case ...
await this.cacheManager.set(key, response, 60_000);      // TTL in ms

// after create/update/delete/toggle:
await clearProductListCache(this.cacheManager);
```

- Keys/invalidation helpers live in `presentation/cache/*.keys.ts`. Use cases stay cache-unaware.
- Every mutating endpoint of a cached resource must call the clear helper — a missed one serves stale data.
- Note: `activeKeys` in `product-cache.keys.ts` is per-process; with several replicas, invalidation only clears the local key set.

## Auth and security defaults

- Login `POST /api/v1/auth/login` → bearer token; sign-up is Better-Auth at `/api/auth/sign-up/email` (no `/v1`) and always creates `CLIENT`.
- Deny by default on Better-Auth `additionalFields`: set `input: false` unless a client must set it (this prevented the `role` self-promotion bug).
- Rate limiting: global `ThrottlerGuard` (10/min); override per controller/route with `@Throttle(...)` (auth uses 5/min).
- `AuditInterceptor` logs mutating requests as structured JSON; use Nest's `Logger`, not `console.log`.
- Never log tokens, passwords or full request bodies.

## Business rules

Order state machine, stock deduction on `RECEIVED → IN_PREPARATION`, refund on cancel from `IN_PREPARATION`, and role permissions live in `docs/business-rules.md`. Implement them in the domain/use cases; don't redefine them here.

## Checklist for a new use case

1. `application/use-cases/<feature>/<action>-<resource>.use-case.ts` returning `Either`
2. Sibling `.spec.ts` against in-memory fakes (update the fake if the repo interface changed)
3. Register with `useFactory` in `modules/<feature>.module.ts`
4. Inject into the controller; unwrap with `isLeft()`; add DTO + Swagger decorators + `@Roles`
5. Invalidate caches if it mutates a cached resource
6. Run the gate: `pnpm lint && pnpm check && pnpm test` (and `pnpm test:e2e` before pushing)
