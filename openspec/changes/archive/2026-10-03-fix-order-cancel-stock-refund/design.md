# Design

## Context

`UpdateOrderStatusUseCase` validates the transition on an in-memory `Order`, calls `DeductForOrderUseCase` for `IN_PREPARATION`, then `orderRepo.updateStatus`. Each repository call is its own statement, there is no transaction, `updateStatus` is unconditional, and nothing handles `CANCELLED`. Drizzle repositories read `drizzleService.db` directly. Use cases must stay framework-free and return `Either`. See proposal.md for motivation and specs/order-stock-consistency/spec.md for requirements.

## Goals / Non-Goals

**Goals:**
- Refund exactly what was deducted, once, when cancelling from `IN_PREPARATION`.
- Make the status change race-safe and atomic with stock changes.
- Keep the domain/application layers free of Drizzle and NestJS.

**Non-Goals:**
- Stock reservation at order creation (documented limitation, unchanged).
- A new `movement_type` value or any schema migration.
- Fixing low-stock comparison, category/product delete, or zero-quantity DTOs (separate change).

## Decisions

1. **Refund from the movement log, not the recipe.** The refund sums the order's `DEDUCTION` movements per ingredient. Recipes can change after deduction; the log records what actually left stock. Needs a new `IInventoryMovementRepository.findByOrderId(orderId)`. Alternative (recompute from current recipes) rejected: can refund the wrong amount.

2. **Reuse `RESTOCK` with `orderId` and note `Order <id> cancelled`.** Avoids an enum migration. Alternative (new `REFUND` enum value) is cleaner semantically but needs a migration and touches dashboards/filters; revisit later if wanted.

3. **Conditional transition in the repository.** Add `IOrderRepository.transitionStatus(id, from, to, baristaId?)` returning `Order | null`, implemented as `UPDATE ... WHERE id = ? AND status = ? RETURNING`. `null` means the status changed concurrently and the use case returns `ConflictError`. Alternative (row lock `SELECT ... FOR UPDATE`) rejected as more Drizzle-specific surface for the same guarantee. The old `updateStatus` stays for other callers (seed, tests).

4. **Unit of work via a domain port.** New `abstract class IUnitOfWork { run<T>(fn: () => Promise<T>): Promise<T> }`. `DrizzleUnitOfWork` calls `db.transaction` and stores the transaction in an `AsyncLocalStorage`; `DrizzleService.db` becomes a getter returning the active transaction or the base instance, so every existing repository joins the transaction without signature changes. Alternative (pass a `tx` argument through every repository method) rejected: invasive and leaks Drizzle types into the domain. The in-memory fake runs `fn` directly (optionally snapshotting for rollback tests).

5. **Order of operations inside the transaction:** conditional status transition first (fails fast on a race, before any stock change), then deduct/refund and movements. `IUnitOfWork.run` takes a callback returning an `Either` and rolls back when it is a `Left` (the Drizzle adapter uses an internal rollback signal), so use cases keep the "Either, never throw" contract.

6. **Deduction hardening.** `DeductForOrderUseCase` returns `NotFoundError` for a missing ingredient instead of `continue`. Its compensating-restock loop is kept as defense in depth for callers outside a unit of work (the transaction is the primary guarantee).

7. **New `RefundForOrderUseCase`** (framework-free, own spec) called by `UpdateOrderStatusUseCase` when `order.status === 'IN_PREPARATION' && newStatus === 'CANCELLED'`.

## Risks / Trade-offs

- [AsyncLocalStorage context lost across non-awaited work] → all repository calls in the unit of work are awaited; covered by an E2E rollback test.
- [Orders deducted before this fix have `DEDUCTION` movements but may already be cancelled] → they are not refunded retroactively; note in docs, correct manually via `ADJUSTMENT` if needed.
- [Old cancelled-after-deduction data has no refund movement] → acceptable; no data migration.
- [Transaction holds a pooled connection for the duration] → work inside is a handful of statements.
