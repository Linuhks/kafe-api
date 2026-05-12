## Why

The kafe-api has no rate limiting, no security headers, and a hardcoded CORS fallback — leaving the authentication endpoint open to brute-force, the app exposed to common browser attacks, and production origins misconfigured by default. A security review (2026-05-08) identified 3 critical, 3 high, 3 medium, and 1 low severity issues that must be addressed before this API handles real users.

## What Changes

- Add `helmet` middleware for security headers (X-Frame-Options, CSP, HSTS, X-Content-Type-Options)
- Add `@nestjs/throttler` with a global limit and a stricter per-IP limit on the auth route
- Remove the `http://localhost:3001` CORS fallback — fail loudly on startup if `CORS_ORIGIN` is absent
- Increase `minPasswordLength` from 8 to 12 in the better-auth configuration
- Add `@Max()` / `@Min()` bounds to `price` and `quantity` fields in product and ingredient DTOs
- Implement an audit-logging interceptor that records who performed which sensitive operation and its outcome
- Reserve inventory atomically at order creation to eliminate the overselling race condition
- Set `SameSite=Strict` on session cookies and validate better-auth cookie configuration

## Capabilities

### New Capabilities

- `api-rate-limiting`: Global throttling guard + stricter auth-route limit via `@nestjs/throttler`
- `security-headers`: Helmet middleware applied at bootstrap
- `audit-logging`: Interceptor that persists structured audit events (user, action, entity, timestamp, outcome) for every mutating operation

### Modified Capabilities

- None — all changes are additive infrastructure hardening or input constraint tightening (no existing spec behavior changes)

## Impact

- **`src/main.ts`**: helmet, throttler, CORS strict origin
- **`app.module.ts`**: ThrottlerModule registration
- **`src/infrastructure/auth/better-auth.ts`**: password policy
- **`src/presentation/dtos/create-product.dto.ts`**, **`create-ingredient.dto.ts`**: @Max/@Min on price/quantity
- **`src/presentation/interceptors/transform.interceptor.ts`**: replaced with audit interceptor
- **`src/application/use-cases/orders/create-order.use-case.ts`**: inventory reservation inside transaction
- **Dependencies added:** `helmet`, `@nestjs/throttler`
