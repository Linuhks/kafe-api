# src/test/repositories

In-memory repository implementations for unit tests. No database, no NestJS bootstrap needed.

## Pattern

Each class extends the domain `I<X>Repository` and stores state in a public `items` array:

```typescript
export class InMemoryUserRepository extends IUserRepository {
  items: User[] = [];
  private counter = 0;

  async findById(id: string): Promise<User | null> {
    return this.items.find((u) => u.id === id) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = new User(`user-${++this.counter}`, data.name, data.email, data.role, true, new Date(), new Date());
    this.items.push(user);
    return user;
  }
  // ...
}
```

IDs use incremental counters: `user-1`, `user-2`, `product-1`, etc.

## Usage in tests

```typescript
describe('CreateUserUseCase', () => {
  let repo: InMemoryUserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new CreateUserUseCase(repo);
  });

  it('should create a user', async () => {
    const user = await useCase.execute({ name: 'Test', email: 'test@test.com', password: '12345678', role: 'CLIENT' });
    expect(user.email).toBe('test@test.com');
  });

  it('pre-populate state via items array', async () => {
    repo.items.push(new User('u1', 'Existing', 'exist@test.com', 'CLIENT', true, new Date(), new Date()));
    await expect(useCase.execute({ email: 'exist@test.com', ... })).rejects.toThrow(ConflictError);
  });
});
```

## Rules

- Do NOT mock repositories with `vi.fn()` — use these in-memory implementations
- Manipulate `repo.items` directly in `beforeEach` to set up initial state
- Available: `InMemoryUserRepository`, `InMemoryProductRepository`, `InMemoryCategoryRepository`, `InMemoryIngredientRepository`, `InMemoryInventoryMovementRepository`, `InMemoryOrderRepository`
