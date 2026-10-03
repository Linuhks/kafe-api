## 1. Transaction and conditional-transition infrastructure

- [x] 1.1 Add `IUnitOfWork` port; add `DrizzleUnitOfWork` using `AsyncLocalStorage`; make `DrizzleService.db` return the active transaction when present; add `InMemoryUnitOfWork` fake
- [x] 1.2 Add `IOrderRepository.transitionStatus(id, from, to, baristaId?)` (Drizzle conditional `UPDATE ... RETURNING`, in-memory fake) and `IInventoryMovementRepository.findByOrderId` (Drizzle + fake)
- [x] 1.3 Register `IUnitOfWork` in `OrdersModule`

## 2. Use cases

- [x] 2.1 Harden `DeductForOrderUseCase`: return `NotFoundError` for a missing ingredient, drop the manual compensation loop; update its spec
- [x] 2.2 Add `RefundForOrderUseCase` (sums the order's `DEDUCTION` movements, restocks, writes `RESTOCK` movements with `orderId` and note) with `.spec.ts`
- [x] 2.3 Rework `UpdateOrderStatusUseCase`: run transition + deduct/refund inside `IUnitOfWork.run`, use `transitionStatus`, return `ConflictError` on a lost race, refund on `IN_PREPARATION → CANCELLED`; update wiring in `OrdersModule`
- [x] 2.4 Extend `update-order-status.use-case.spec.ts`: refund on cancel, no refund from `RECEIVED`, conflict on lost race, rollback when deduction fails

## 3. E2E and docs

- [ ] 3.1 Add E2E cases in the orders suite: `RECEIVED → IN_PREPARATION → CANCELLED` restores stock and creates a `RESTOCK` movement with `orderId`; concurrent double `IN_PREPARATION` deducts once (requires `docker compose up -d`)
- [ ] 3.2 Update `docs/business-rules.md` (refund on cancel, atomicity, concurrency, pre-fix data note) and run the full gate: `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e -- orders`
