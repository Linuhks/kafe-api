# src/domain

Core business rules — zero framework dependencies. Never import NestJS, Drizzle, or any infrastructure here.

## Entities (`entities/`)

Immutable value objects: all fields `readonly`, set via constructor only, no business methods.

```typescript
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    // ...
  ) {}
}
```

Entities: `User`, `Product`, `Category`, `Ingredient`, `InventoryMovement`, `Order`, `OrderItem`.

## Repository Interfaces (`repositories/`)

Use `abstract class` (not `interface`) so NestJS can use the class as an injection token.

Define input data types in the same file as the interface:

```typescript
export interface CreateUserData { name: string; email: string; password: string; role: string }
export interface UpdateUserData { name?: string; role?: string; isActive?: boolean }

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract create(data: CreateUserData): Promise<User>;
  // ...
}
```

Repositories: `IUserRepository`, `IProductRepository`, `ICategoryRepository`, `IIngredientRepository`, `IInventoryMovementRepository`, `IOrderRepository`.

## Errors (`errors/domain.error.ts`)

`DomainError` base carries `statusCode` — the HTTP filter uses it directly.

Available error classes:
- `NotFoundError(resource: string)` → 404
- `ConflictError(message: string)` → 409
- `InvalidOrderTransitionError(from: string, to: string)` → 400
- `InsufficientStockError(ingredient: string)` → 400

Throw these from use cases. Never throw `HttpException` in the domain or application layers.
