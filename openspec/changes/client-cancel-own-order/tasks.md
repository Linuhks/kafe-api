# Tasks

## 1. Use case

- [x] 1.1 Create `CancelMyOrderUseCase` in `src/application/use-cases/orders/cancel-my-order.use-case.ts` with sibling `.spec.ts` covering: owner cancels `RECEIVED`; missing order, other user's order and anonymous order → `NotFoundError`; `IN_PREPARATION`/`READY`/`DELIVERED`/`CANCELLED` → `InvalidOrderTransitionError` with status unchanged; no stock/movement changes. Verify with `pnpm test -- cancel-my-order`.

## 2. Endpoint

- [x] 2.1 Register the use case via `useFactory` in `src/modules/orders.module.ts` and add `POST :id/cancel` to `OrdersController` (no body, `@CurrentUser()`, no `@Roles`, Swagger responses 200/400/401/404, `throw result.value` on Left). Verify with `pnpm lint && pnpm check`.
- [ ] 2.2 Add E2E cases to `test/controllers/orders.e2e.spec.ts`: owner 200 with unchanged stock; other user 404; anonymous order 404; no token 401; non-`RECEIVED` statuses 400 and unchanged; concurrent cancel vs barista `IN_PREPARATION` yields one winner and consistent stock. Verify with `pnpm test:e2e -- orders` (requires `docker compose up -d`).

## 3. Docs and gate

- [ ] 3.1 Update `docs/business-rules.md` (client cancellation rule: owner only, `RECEIVED` only, no stock change; mention endpoint in the roles/orders sections). Verify the doc matches the E2E behaviour.
- [ ] 3.2 Run the full gate `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e` and confirm all pass.
