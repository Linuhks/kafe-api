## Context

`UpdateOrderStatusUseCase` already validates transitions (`RECEIVED → CANCELLED` is valid) and applies them via `orderRepo.transitionStatus(id, expectedStatus, newStatus)`, which is conditional on the current status and runs inside a unit of work. The only gap is access: `PATCH /orders/:id/status` is `BARISTA`/`ADMIN` only, and `GET /orders/:id` is staff-only. `Order.clientId` is `string | null` (null for anonymous orders).

## Goals / Non-Goals

**Goals:** let the owner cancel a `RECEIVED` order safely under concurrency.
**Non-Goals:** cancelling after preparation starts, refunds/payments, notifying the barista, changing the staff status endpoint, schema changes.

## Decisions

1. **Dedicated route `POST /orders/:id/cancel`** rather than opening `PATCH :id/status` to clients. That endpoint accepts arbitrary target statuses; exposing it to clients would need per-role status filtering and risks letting clients advance orders. A purpose-built action has no body and a single outcome.
2. **New `CancelMyOrderUseCase(orderRepo, updateOrderStatus)`** in `application/use-cases/orders/`. It loads the order, returns `NotFoundError('Order')` if missing or `order.clientId !== userId` (covers anonymous orders and avoids leaking existence), returns `InvalidOrderTransitionError` if status is not `RECEIVED`, then delegates to `UpdateOrderStatusUseCase.execute(id, 'CANCELLED')` and propagates its `Either` as-is. Reusing it keeps transition, atomicity and conflict handling in one place. Wired with `useFactory` in `orders.module.ts`.
3. **Strict `RECEIVED` check in the use case**, even though `IN_PREPARATION → CANCELLED` is valid for staff, because clients must not cancel once the barista took the order (and stock was deducted).
4. **No `@Roles`**: any authenticated session passes the global guard; ownership is the authorization. `userId` comes from `@CurrentUser()`, never from the request.
5. **404 for non-owner** instead of 403, to avoid order-id probing. Error for wrong status reuses `InvalidOrderTransitionError` (400), consistent with the staff endpoint.

## Risks / Trade-offs

- Race between barista start and client cancel → handled by the conditional update; loser sees 409/400. Covered by an E2E concurrency case.
- Client check-then-act on status is only a fast-fail; the authoritative guard is `transitionStatus(id, 'RECEIVED', 'CANCELLED')`.
- Anonymous orders cannot be cancelled by their creator (no identity to verify); staff can still do it.

## Open Questions

None.
