# Business Rules

Business rules are **not duplicated here**. They live in OpenSpec, which is the single source of truth (see [CLAUDE.md](../CLAUDE.md#source-of-truth)). Read the spec for the area you're touching; change a rule only through an OpenSpec change (`/opsx:propose`).

| Area | Spec |
|---|---|
| Roles, server-assigned `role`/`isActive`, deactivated users | [`auth-access-control`](../openspec/specs/auth-access-control/spec.md) |
| Order creation, status state machine, barista queue | [`order-lifecycle`](../openspec/specs/order-lifecycle/spec.md) |
| Stock deduction, refund on cancel, atomicity, concurrency | [`order-stock-consistency`](../openspec/specs/order-stock-consistency/spec.md) |
| Client cancels own order | [`client-order-cancellation`](../openspec/specs/client-order-cancellation/spec.md) |
| Categories, products, recipes | [`menu-catalog`](../openspec/specs/menu-catalog/spec.md) |
| Ingredients, alerts, movements | [`inventory-management`](../openspec/specs/inventory-management/spec.md) |
| Dashboard (ADMIN only) | [`dashboard-analytics`](../openspec/specs/dashboard-analytics/spec.md) |

The remaining specs in `openspec/specs/` cover cross-cutting concerns (rate limiting, audit logging, security headers, cache, Swagger envelope, seeds, Docker, E2E infra, documentation).
