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

**All three must pass before committing.** `pnpm test:e2e` is intentionally excluded from the per-subtask loop (it requires a live PostgreSQL instance and is ~10× slower than unit tests). Run it manually before opening a PR and in CI.

### E2E isolation model

`pnpm test:e2e` creates a fresh PostgreSQL database named `kafe_test_<uuid>` per suite, runs all Drizzle migrations into it, boots the full `AppModule`, and drops the database on teardown — even when tests fail. No `kafe_test_*` databases are left behind after a complete run. If any command fails, fix the issue and re-run from `pnpm lint`.

Once all three pass, commit:

```bash
git add <changed files>
git commit -m "feat(scope): description of what was done"
```

> **Note:** `git push` runs the pre-push Husky hook, which executes both `pnpm run test` and `pnpm run test:e2e` before the push is allowed. A running PostgreSQL instance is required for the e2e suite to pass. Use `git push --no-verify` only when you have a deliberate reason to skip the gate.

Then move on to the next subtask or task and repeat.

---

## Definition of done (per task)

`pnpm test` passing is not, by itself, proof that a task works. Before a task is considered complete:

- If the task adds or changes a controller endpoint, an auth/role check, or a stateful flow (orders, inventory, auth), run the relevant `pnpm test:e2e` suite and confirm it passes — do not defer this to "before opening a PR." A unit test against an in-memory fake proves the use case's logic is right; it does not prove the controller, DB, and auth guard are wired together correctly.
- If there is no E2E suite for the affected area yet, add one as part of the task, or explicitly note in the commit/PR why a manual run was sufficient (e.g. pure refactor with no behavior change).
- If the task is tracked in an external tool (e.g. Task Master) in addition to OpenSpec, update both before marking the task done. A change should never be archived in OpenSpec while an external tracker still shows the task in progress — pick one source of truth if this keeps happening.

### Security-sensitive tasks

A task that touches authentication, roles/permissions, `additionalFields` on the user model, or anything in `docs/business-rules.md` needs an explicit answer to these before it's done — not as a follow-up audit:

- Can a client set this field/value directly, and should they be able to?
- Which roles can reach this endpoint, and is that enforced by `@Roles()` / `@AllowAnonymous()`, not just by the frontend hiding a button?
- Is there a negative test (wrong role, deactivated user, unauthenticated request) proving the rejection actually happens?

Run the `security-review` skill on the diff before committing when any of the above applies.

---

## Documentation update

When **all subtasks of a task are done** (task complete, not subtask), review whether any of the following need updating before committing:

| File | Update when |
|---|---|
| `docs/architecture.md` | New layer, new cross-cutting pattern, or flow change |
| `docs/modules.md` | New use case, entity, repository, or controller added |
| `docs/business-rules.md` | New or changed business rule, state transition, or permission |
| `docs/code-guide.md` | New naming convention, new file type, or changed dev command |
| `docs/API.md` | New or changed endpoint, DTO, or auth requirement |
| `src/<layer>/CLAUDE.md` | New invariant or pattern specific to that layer |

If nothing changed that affects the docs, no update is needed — the check itself is the requirement, not the update.

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
── Task 1 complete: gate  →  update docs  →  commit ──
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
── Task 2 complete: gate  →  update docs  →  commit ──
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
