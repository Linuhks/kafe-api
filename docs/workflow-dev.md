# Development Workflow

Every feature or bug fix is broken down into tasks with numbered subtasks. The same quality gate applies to every subtask, across every task.

---

## Task structure

```
Task 1 — Feature name
  1.1  First subtask
  1.2  Second subtask
  1.3  Third subtask

Task 2 — Another feature
  2.1  First subtask
  2.2  Second subtask
```

---

## Per-subtask gate

After completing any subtask (1.1, 1.2, 2.1, 2.2 — regardless of which task), run in order:

```bash
pnpm lint    # Biome linter with auto-fix
pnpm check   # Biome full check (format + lint) with auto-fix
pnpm test    # Vitest unit tests
```

**All three must pass before committing.** If any command fails, fix the issue and re-run from `pnpm lint`.

Once all three pass, commit:

```bash
git add <changed files>
git commit -m "feat(scope): description of what the subtask did"
```

Then move on to the next subtask and repeat.

---

## Example flow

```
Implement 1.1
  ↓
pnpm lint  → pass
pnpm check → pass
pnpm test  → pass
  ↓
git commit -m "feat(orders): add CreateOrderUseCase"
  ↓
Implement 1.2
  ↓
pnpm lint  → pass
pnpm check → pass
pnpm test  → pass
  ↓
git commit -m "feat(orders): add DrizzleOrderRepository"
  ↓
Implement 1.3  →  gate  →  commit
  ↓
Implement 2.1
  ↓
pnpm lint  → pass
pnpm check → pass
pnpm test  → pass
  ↓
git commit -m "feat(inventory): add RestockIngredientUseCase"
  ↓
Implement 2.2  →  gate  →  commit
```

One commit per subtask. Each commit must leave the codebase in a working state.

---

## Code standards

### Use cases must have a spec file

Every use case file must have a sibling test file:

```
create-order.use-case.ts      ← implementation
create-order.use-case.spec.ts ← required
```

Tests use in-memory repositories — no database, no NestJS bootstrapping. See [Code Guide](./code-guide.md) for the pattern.

### No `any`

Never use `any`. Always declare explicit types:

```typescript
// ❌
const result: any = await repo.findById(id);

// ✅
const result: Order | null = await repo.findById(id);
```

If the type is unknown (e.g. external error), use `unknown` and narrow it:

```typescript
error: (err: unknown) => {
  const statusCode = err instanceof HttpException ? err.getStatus() : 500;
}
```
