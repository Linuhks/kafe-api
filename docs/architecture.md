# Architecture

`kafe-api` follows **Clean Architecture** on top of NestJS. Code is organised into four layers with unidirectional dependencies: inner layers have no knowledge of outer layers.

```
presentation  →  application  →  domain
infrastructure                →  domain
```

---

## Layers

### Domain

`src/domain/`

The core of the system. Has no dependency on any framework, external library, or database.

Contains:
- **Entities**: classes representing business concepts (`Order`, `Product`, `Ingredient`, `User`, etc.) that encapsulate validation rules and state transitions
- **Repository interfaces**: contracts (`IOrderRepository`, `IUserRepository`, etc.) that define what the application needs to persist — without specifying *how*
- **Domain errors**: typed errors representing business rule violations (`InvalidOrderTransitionError`, `InsufficientStockError`, etc.)

Rule: no `import` from `@nestjs/*`, Drizzle, Better-Auth, or any external dependency in this layer.

---

### Application

`src/application/use-cases/`

Orchestrates business use cases. Each use case is a class with a single `execute()` method.

- Receives and returns domain types (entities, primitives)
- Depends only on domain repository interfaces
- Has no knowledge of HTTP, database, or NestJS
- One use case per file, grouped by module (`users/`, `menu/`, `orders/`, `inventory/`, `dashboard/`)

---

### Infrastructure

`src/infrastructure/`

Concrete implementations of the contracts defined in the domain.

- **Drizzle repositories**: implement `IXxxRepository` using Drizzle ORM + PostgreSQL
- **Better-Auth**: authentication and session management (managed separately in `auth-schema.ts`)
- **Schema**: table definitions in `schema.ts`

---

### Presentation

`src/presentation/`

HTTP layer. Integrates with NestJS and exposes the REST API.

- **Controllers**: receive requests, call use cases, return responses
- **DTOs**: input/output validation and typing with `class-validator` and `class-transformer`
- **Guards / Decorators**: role-based access control (`@Roles`, `AuthGuard`)

---

## Request flow

```
HTTP Request
    ↓
Controller (presentation)
    → validates DTO
    → calls Use Case (application)
        → calls Repository Interface (domain)
            → Drizzle Repository (infrastructure) executes SQL
        ← returns Entity
    ← returns result
    → maps to HTTP response
HTTP Response
```

Concrete example — `POST /api/v1/orders`:

1. `OrdersController.create()` receives the body, validates with `CreateOrderDto`
2. Calls `CreateOrderUseCase.execute(dto)`
3. The use case fetches products via `IProductRepository`, calculates the total, and persists via `IOrderRepository`
4. The controller returns the created order with status 201

Example — `PATCH /api/v1/orders/:id/status` to `IN_PREPARATION`:

1. `OrdersController.updateStatus()` validates the body with `UpdateOrderStatusDto`
2. Calls `UpdateOrderStatusUseCase.execute(id, 'IN_PREPARATION', baristaId)`
3. The use case validates the state transition, then calls `DeductForOrderUseCase`
4. `DeductForOrderUseCase` checks and deducts ingredients from stock; throws `InsufficientStockError` if stock is insufficient
5. The controller returns the updated order with status 200

---

## NestJS modules

See [`docs/modules.md`](./modules.md) for the full module index with use cases, entities, and repositories per feature.
