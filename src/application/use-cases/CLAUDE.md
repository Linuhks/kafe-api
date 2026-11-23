# src/application/use-cases

Business logic orchestration. No framework dependencies — only domain imports.

## Pattern

Each use case is a class with one constructor (receiving repo(s)) and one `execute()` method that returns `Either<DomainError, T>`:

```typescript
export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, User>> {
    const user = await this.userRepo.findById(id);
    if (!user) return left(new NotFoundError('User'));
    return right(user);
  }
}
```

Rules:
- Never import `@nestjs/*` here
- Return `left(new XxxError(...))` — never throw domain errors from use cases
- Depend only on repository interfaces, never on concrete implementations
- Import `Either`, `left`, `right` from `../../../domain/either`

When composing use cases (e.g. `UpdateOrderStatusUseCase` → `DeductForOrderUseCase`):
```typescript
const deductResult = await this.deductForOrder.execute(order);
if (deductResult.isLeft()) return left(deductResult.value);
```

## Subfolders

| Folder | Use cases |
|---|---|
| `users/` | create, list, get, update, delete |
| `menu/` | categories (create/get/list/update/delete) + products (create/get/list/update/delete/toggle-availability) + recipes (add/list/remove-product-ingredient) |
| `orders/` | create, get, list, get-my-orders, get-barista-queue, update-order-status, cancel-my-order |
| `inventory/` | create-ingredient, get-ingredient, list-ingredients, update-ingredient, restock-ingredient, deduct-for-order, refund-for-order, list-movements, get-stock-alerts |
| `dashboard/` | get-summary, get-top-products, get-peak-hours |

## Tests

All use cases have a `*.spec.ts` sibling using in-memory repositories from `test/repositories/` (project root), imported via the `@test/*` alias. No NestJS bootstrapping needed.

## Adding a new use case

1. Create `<action>-<resource>.use-case.ts` in the appropriate subfolder
2. Add `<action>-<resource>.use-case.spec.ts` for unit tests
3. Register in the feature module (`src/modules/<name>.module.ts`) with `useFactory`:
   ```typescript
   { provide: MyUseCase, useFactory: (repo) => new MyUseCase(repo), inject: [IMyRepository] }
   ```
4. Inject into the controller constructor
