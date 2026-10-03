# Proposal

## Why

Cancelling an order that is already `IN_PREPARATION` never returns the ingredients that were deducted when it entered preparation, so inventory drifts downward with every cancellation. The same transition code is also unsafe under concurrency (two parallel `IN_PREPARATION` requests both pass validation and deduct stock twice) and is not atomic (a failure midway leaves stock deducted with no movement record, or a status that disagrees with stock).

## What Changes

- Cancelling an order from `IN_PREPARATION` restores every ingredient that was deducted for it and records one `RESTOCK` movement per ingredient, linked to the order (`orderId`) with a note. No new enum value, no migration.
- Cancelling from `RECEIVED` performs no stock change (nothing was deducted).
- The status update becomes conditional on the status the use case validated against (`WHERE status = <expected>`). If another request changed the status first, the transition fails with a conflict and no stock is touched.
- Deduction, movement records and the status update for `IN_PREPARATION` run in a single database transaction; the cancel refund and its status update likewise. Any failure rolls everything back.
- Deduction no longer silently skips a recipe ingredient that cannot be found; it fails instead.
- `docs/business-rules.md` is updated (stock refund on cancel, atomicity, concurrency).

## Capabilities

### New Capabilities
- `order-stock-consistency`: how order status transitions keep ingredient stock and `inventory_movements` consistent (deduction on `IN_PREPARATION`, refund on cancel from `IN_PREPARATION`, atomicity, and concurrent-transition safety).

### Modified Capabilities

## Impact

- Code: `UpdateOrderStatusUseCase`, `DeductForOrderUseCase`, new refund use case, `IOrderRepository` (conditional transition), a new `IUnitOfWork` port, `DrizzleService`/Drizzle repositories (transaction-aware), `OrdersModule` wiring, in-memory fakes.
- API: `PATCH /orders/:id/status` can now return 409 when the order changed concurrently; no request/response shape change.
- Database: none (no schema change, no migration).
- Docs: `docs/business-rules.md`.

## Security Considerations

- No fields become client-writable; the request body (`status`) is unchanged.
- The endpoint stays restricted to `BARISTA` and `ADMIN` via `@Roles`; unauthenticated, `CLIENT` and deactivated users are still rejected by the existing guard. Cancellation is not exposed to clients.
- The conditional update closes a race that let a barista (or a retried request) deduct stock twice, which is an integrity/abuse concern on order state.

## Verification

- Unit specs against in-memory fakes for refund, no-refund on `RECEIVED` cancel, conditional-transition conflict, and rollback on failure.
- `pnpm test:e2e -- orders` (needs `docker compose up -d`): full flow `RECEIVED → IN_PREPARATION → CANCELLED` asserts ingredient stock returns to its original value and a `RESTOCK` movement with the `orderId` exists; a concurrent double `IN_PREPARATION` deducts only once.
