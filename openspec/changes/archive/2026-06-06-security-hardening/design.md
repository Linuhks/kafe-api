## Context

kafe-api is a NestJS REST API using Drizzle ORM and better-auth for authentication. The app currently has no rate limiting, no security headers, and a CORS fallback that defaults to `localhost:3001` in production. A formal security review (2026-05-08, OWASP Top 10:2025 / ASVS 5.0) surfaced 3 critical, 3 high, 3 medium, and 1 low issues. The highest-impact issues are all infrastructure-level hardening that do not require model or API surface changes.

## Goals / Non-Goals

**Goals:**
- Add Helmet security headers globally
- Add rate limiting (global + auth-route-specific) via `@nestjs/throttler`
- Enforce strict CORS origin (fail on startup if `CORS_ORIGIN` absent)
- Raise minimum password length to 12
- Add `@Max` / `@Min` bounds on price and quantity DTO fields
- Implement a structured audit-logging interceptor for mutating operations
- Reserve inventory inside the order-creation transaction (eliminate overselling race)
- Harden better-auth session cookie (`SameSite=Strict`)

**Non-Goals:**
- HIBP (Have I Been Pwned) breach password check — deferred; requires external API dependency
- Full CSRF double-submit token pattern — bearer-token API; `SameSite=Strict` is sufficient for current auth model
- Replacing the in-memory logger with a centralized log aggregator
- Changing public API shape or adding new endpoints

## Decisions

### D1 — Helmet via package middleware, not a custom interceptor

**Decision:** `pnpm add helmet` and call `app.use(helmet())` in `main.ts` before any routes.

**Rationale:** Helmet is the de facto standard for NestJS/Express security headers. Applying it at bootstrap ensures headers are set on every response including error paths. A custom interceptor could miss responses short-circuited before it runs (e.g., `ValidationPipe` failures before the route handler).

**Alternatives considered:** `@nestjs/helmet` re-exports the same package; using the raw package avoids an unnecessary wrapper.

---

### D2 — ThrottlerModule with two tiers

**Decision:** Global rule of 10 requests / 60 s per IP. Auth route override of 5 requests / 60 s per IP via `@Throttle()` decorator on the controller.

**Rationale:** A single global limit protects all endpoints without per-route config. The tighter auth-route limit satisfies ASVS 2.2.1 (lockout after repeated failures) without introducing storage overhead from per-user attempt counters.

**Alternatives considered:** Per-user (not per-IP) throttling would be more accurate but requires authenticated context; since we need to protect login itself (unauthenticated), IP is the appropriate key.

---

### D3 — CORS origin as required env var via `ConfigService.getOrThrow`

**Decision:** Replace `process.env.CORS_ORIGIN ?? 'http://localhost:3001'` with `configService.getOrThrow<string>('CORS_ORIGIN')`.

**Rationale:** Fail-fast at startup is safer than silently permitting a wrong origin. The fallback is a latent misconfiguration bug in production.

---

### D4 — Audit interceptor, not domain events

**Decision:** Implement `AuditInterceptor` as a NestJS interceptor that taps into the response observable. Log to application logger (NestJS `Logger`) as structured JSON. No new database table.

**Rationale:** A domain event bus would be the clean-architecture ideal but introduces significant infrastructure. Structured JSON logs delivered to the existing logger satisfy ASVS 7.1.1 / 7.1.2 immediately and can be shipped to a log aggregator without code changes. The interceptor pattern already exists (`transform.interceptor.ts`) and is registered globally — extending it is the lowest-friction path.

**Alternatives considered:** Domain event emitter — more decoupled but substantial scope; database audit table — queryable but requires migration and schema changes.

---

### D5 — Inventory reservation via atomic SQL update in `DeductForOrderUseCase`

**Decision:** Fix the TOCTOU race in `DeductForOrderUseCase` by replacing the two-pass loop (check pass, then deduct pass) with a single atomic SQL statement per ingredient:

```sql
UPDATE ingredients
SET current_stock = current_stock - $qty
WHERE id = $id AND current_stock >= $qty
RETURNING id
```

If the update returns 0 rows, stock is insufficient — return `left(new InsufficientStockError(...))`. No explicit transaction wrapper needed; the single-statement update is inherently atomic.

Add `deductStockIfSufficient(id: string, quantity: string): Promise<boolean>` to `IIngredientRepository`. The Drizzle implementation executes the atomic update and returns `true` if a row was affected. The in-memory fake does a compare-and-swap.

**Rationale:** The race lives in `DeductForOrderUseCase` (called at `IN_PREPARATION` transition), not at order creation. Moving deduction to order creation (Option A) would require a `UnitOfWork` pattern to coordinate a transaction across multiple repositories — a pattern that does not exist in this codebase and is out of scope. It would also prematurely deduct stock before a barista accepts the order. The atomic SQL approach closes the race without layer boundary violations, no schema changes, and no new architectural patterns.

**Alternatives considered:**
- Option A (`CreateOrderUseCase` + cross-repo transaction) — ruled out: requires `UnitOfWork` pattern, premature stock deduction at order placement.
- `reserved_quantity` column — more observable but requires schema migration and release logic.
- Explicit `SELECT FOR UPDATE` inside a transaction — correct but more complex than a single conditional `UPDATE`; the atomic update is simpler and equivalent.

## Risks / Trade-offs

- **Throttler and legitimate burst traffic** → Mitigation: set the global limit generously (10 req/60 s) and only tighten on auth. Adjust with real traffic data before going to production.
- **Audit interceptor performance** → Logging on every mutating response adds I/O. Mitigation: use async logging; do not await the log write inside the response path.
- **`getOrThrow` breaks local dev if `CORS_ORIGIN` is not in `.env`** → Mitigation: add `CORS_ORIGIN=http://localhost:3001` to `.env.example` with a clear comment marking it as required in production.
- **Partial deduction on multi-ingredient failure** → If ingredient A is deducted atomically but ingredient B fails, A must be rolled back. Mitigation: `DeductForOrderUseCase` tracks successfully deducted ingredients and restocks them on any failure before returning the error.
- **Atomic update under high order volume** → The conditional `UPDATE WHERE current_stock >= qty` holds a row-level lock for microseconds. For high-throughput scenarios, a queue-based reservation system would be needed — noted as future work.

## Migration Plan

1. Install deps (`helmet`, `@nestjs/throttler`) — no schema changes.
2. Update `.env.example` with `CORS_ORIGIN`.
3. Deploy changes to staging; verify headers with `curl -I` and rate-limit with a request burst.
4. Roll back: remove middleware calls and throttler module — no data migration needed.

## Open Questions

- Should the audit log write be fire-and-forget, or should failures surface as a 500? Current decision: fire-and-forget with error swallowing logged to stderr.
- What retention policy applies to audit logs? Out of scope for this change; deferred to ops.
