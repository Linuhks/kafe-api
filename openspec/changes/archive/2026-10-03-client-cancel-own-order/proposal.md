# Proposal

## Why

Today only BARISTA/ADMIN can cancel an order (`PATCH /orders/:id/status`). A client who orders by mistake or changes their mind has no way to cancel, even while the order is still `RECEIVED` and nobody has started it. Letting clients cancel their own order before a barista picks it up removes manual support work and avoids wasted preparation.

## What Changes

- New endpoint `POST /api/v1/orders/:id/cancel` for an authenticated user to cancel **their own** order.
- Cancellation is allowed only while the order is `RECEIVED` (before the barista moves it to `IN_PREPARATION`). Any other status is rejected.
- A user cannot cancel another user's order, nor orders created anonymously (no `clientId`).
- Reuses the existing transition logic, so the conditional status update protects against a barista taking the order at the same moment. No stock is touched (nothing was deducted yet).
- `docs/business-rules.md` documents the client cancellation rule and role permission.

## Capabilities

### New Capabilities
- `client-order-cancellation`: a client cancelling their own order while it is still `RECEIVED`, including ownership and status rules.

### Modified Capabilities
- `order-stock-consistency`: add a scenario that a client cancel racing with the barista's `IN_PREPARATION` transition results in exactly one winner and consistent stock.

## Impact

- Code: new `CancelMyOrderUseCase` (`src/application/use-cases/orders/`), new route in `OrdersController`, wiring in `orders.module.ts`, in-memory fakes unchanged.
- API: one new endpoint; no changes to existing ones. No DB schema change or migration.
- Docs: `docs/business-rules.md`, Swagger annotations.

## Security Considerations

- **Client-writable fields**: none. The request has no body; the order id comes from the path and the actor from the session, never from client input.
- **Roles**: any authenticated user (CLIENT, BARISTA, ADMIN) can reach the route, but the use case only succeeds if `order.clientId === session user id`. Staff cancel other people's orders through the existing `PATCH /orders/:id/status`.
- **Unauthenticated**: rejected by the global auth guard (401); the route is not `@AllowAnonymous()`.
- **Wrong owner / anonymous order**: responds 404 (same as a missing order) so order ids cannot be probed.
- **Deactivated user**: cannot hold a session (rejected at session creation), so cannot reach the route.
- **Race with barista**: status update is conditional on `RECEIVED`; the loser gets 409/400 and nothing changes twice.

## Verification

New E2E cases in `test/controllers/orders.e2e.spec.ts` (run `pnpm test:e2e -- orders`): owner cancels `RECEIVED` order (200, status `CANCELLED`, stock unchanged); non-owner gets 404; anonymous order gets 404; unauthenticated gets 401; `IN_PREPARATION`/`READY`/`DELIVERED`/`CANCELLED` orders are rejected and unchanged. Unit tests for the use case cover the same rules against in-memory fakes.
