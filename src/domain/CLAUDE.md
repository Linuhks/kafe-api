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

## Value Objects (`value-objects/`)

Identity-less, always-valid values compared by value. Files are kebab-case without a suffix (`email.ts` → `Email`). Pattern:

- private constructor + `readonly value`
- `static create(raw): Either<XxxError, Xxx>` — normalizes, validates, returns `left(...)` on invalid input (never throws)
- `equals(other)` compares by value

```typescript
const emailResult = Email.create(input.email);   // trims + lowercases + format check
if (emailResult.isLeft()) return emailResult;    // propagate Left(InvalidEmailError) as-is
await this.userRepo.findByEmail(emailResult.value);
```

Use value objects at the **repository boundary** (input data types and query parameters, e.g. `CreateUserData.email: Email`, `findByEmail(email: Email)`) so repositories never receive raw input. Entity fields stay primitives (`User.email: string`) — rows read from the DB are trusted and responses keep their shape.

Value objects: `Email`.

## Repository Interfaces (`repositories/`)

Use `abstract class` (not `interface`) so NestJS can use the class as an injection token.

Define input data types in the same file as the interface:

```typescript
export interface CreateUserData { name: string; email: Email; password: string; role: string }
export interface UpdateUserData { name?: string; role?: string; isActive?: boolean }

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract create(data: CreateUserData): Promise<User>;
  // ...
}
```

Repositories: `IUserRepository`, `IProductRepository`, `ICategoryRepository`, `IIngredientRepository`, `IInventoryMovementRepository`, `IOrderRepository`.

## Either (`either.ts`)

Custom `Either<L, R>` type for explicit error handling — zero external dependencies.

```typescript
import { Either, left, right } from '../either';

// Left = error path, Right = success path
const result: Either<NotFoundError, User> = user
  ? right(user)
  : left(new NotFoundError('User'));

result.isLeft()  // true when error
result.isRight() // true when success
result.value     // L or R depending on branch
```

All use cases return `Either` instead of throwing. Controllers unwrap with:
```typescript
const result = await this.useCase.execute(...);
if (result.isLeft()) throw result.value; // DomainError → HttpExceptionFilter
return result.value;
```

## Errors (`errors/domain.error.ts`)

`DomainError` base carries `statusCode` — the HTTP filter uses it directly.

Available error classes:
- `NotFoundError(resource: string)` → 404
- `ConflictError(message: string)` → 409
- `InvalidOrderTransitionError(from: string, to: string)` → 400
- `InsufficientStockError(ingredient: string)` → 400
- `InvalidEmailError()` → 400 (`INVALID_EMAIL`; message never echoes the input)

Never throw these directly in use cases — return `left(new XxxError(...))` instead.
