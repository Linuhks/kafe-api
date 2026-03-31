# src/application/use-cases

Business logic orchestration. No framework dependencies — only domain imports.

## Pattern

Each use case is a class with one constructor (receiving repo(s)) and one `execute()` method:

```typescript
export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: CreateUserData): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new ConflictError('Email already in use');
    return this.userRepo.create(data);
  }
}
```

Rules:
- Never import `@nestjs/*` here
- Throw domain errors (`NotFoundError`, `ConflictError`, etc.) — never `HttpException`
- Depend only on repository interfaces, never on concrete implementations

## Subfolders

| Folder | Use cases |
|---|---|
| `users/` | create, list, get, update, delete |
| `menu/` | categories (create/get/list/update/delete) + products (create/get/list/update/delete/toggle-availability) |
| `orders/` | create, get, list, get-my-orders, get-barista-queue, update-order-status |
| `inventory/` | create-ingredient, get-ingredient, list-ingredients, update-ingredient, restock-ingredient, deduct-for-order, list-movements, get-stock-alerts |
| `dashboard/` | get-summary, get-top-products, get-peak-hours |

## Tests

All use cases (except `dashboard/`) have a `*.spec.ts` sibling using in-memory repositories (see `src/test/repositories/CLAUDE.md`). No NestJS bootstrapping needed.

## Adding a new use case

1. Create `<action>-<resource>.use-case.ts` in the appropriate subfolder
2. Add `<action>-<resource>.use-case.spec.ts` for unit tests
3. Register in the feature module (`src/<feature>.module.ts`) with `useFactory`:
   ```typescript
   { provide: MyUseCase, useFactory: (repo) => new MyUseCase(repo), inject: [IMyRepository] }
   ```
4. Inject into the controller constructor
