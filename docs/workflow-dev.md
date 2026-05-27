# Development Workflow

Every feature or bug fix is broken down into tasks with numbered subtasks. The same quality gate applies to every subtask **and** to every task — no exceptions.

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

## Quality gate

The gate runs after **every subtask** and after **every task** (when all its subtasks are done):

```bash
pnpm lint    # Biome linter with auto-fix
pnpm check   # Biome full check (format + lint) with auto-fix
pnpm test    # Vitest unit tests
```

**All three must pass before committing.** If any command fails, fix the issue and re-run from `pnpm lint`.

Once all three pass, commit:

```bash
git add <changed files>
git commit -m "feat(scope): description of what was done"
```

Then move on to the next subtask or task and repeat.

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
── Task 1 complete: gate  →  commit ──
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
  ↓
── Task 2 complete: gate  →  commit ──
```

One commit per subtask, one commit per completed task. Each commit must leave the codebase in a working state.

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
