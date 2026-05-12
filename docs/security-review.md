# Security Review — kafe-api

**Date:** 2026-05-08  
**Reviewer:** Claude (OWASP Top 10:2025 / ASVS 5.0)  
**Branch:** master  
**Scope:** Full codebase — presentation, application, infrastructure, domain layers

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 3 |
| Medium | 3 |
| Low | 1 |

The codebase follows clean architecture patterns with good separation of concerns. Core data access is safe (Drizzle ORM, no raw SQL). The main gaps are in hardening infrastructure: missing rate limiting, security headers, and audit logging.

---

## Critical

### C1 — No rate limiting on authentication

**Location:** `src/main.ts`, `src/infrastructure/auth/better-auth.ts`  
**OWASP:** A07 (Authentication Failures)  
**ASVS:** 2.2.1

The `/auth/login` endpoint has no throttling. It is fully open to brute-force and credential stuffing attacks.

**Fix:** Install `@nestjs/throttler`, apply a global guard, and set a stricter per-IP limit on the auth route.

```typescript
// app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])

// auth.controller.ts
@Throttle({ default: { ttl: 60_000, limit: 5 } })
```

---

### C2 — No security headers (Helmet missing)

**Location:** `src/main.ts`  
**OWASP:** A02 (Security Misconfiguration)  
**ASVS:** 14.4

`app.use(helmet())` is never called. None of the following headers are set:

- `X-Frame-Options` (clickjacking)
- `X-Content-Type-Options` (MIME sniffing)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Fix:**

```bash
pnpm add @nestjs/helmet
```

```typescript
// src/main.ts
import helmet from 'helmet';
app.use(helmet());
```

---

### C3 — Hardcoded CORS fallback to localhost

**Location:** `src/main.ts:19`  
**OWASP:** A02 (Security Misconfiguration)

```typescript
origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
```

If `CORS_ORIGIN` is not set in a production environment, the server silently allows `localhost:3001` as a valid origin. This is a misconfiguration that bypasses intended origin restrictions.

**Fix:** Remove the fallback and fail loudly on startup if the variable is missing.

```typescript
origin: process.env.CORS_ORIGIN, // required — throw via ConfigService.getOrThrow if absent
```

---

## High

### H1 — Weak password policy

**Location:** `src/infrastructure/auth/better-auth.ts`  
**OWASP:** A07 (Authentication Failures)  
**ASVS:** 2.1.1, 2.1.9

`minPasswordLength: 8` with no complexity rules. ASVS 5.0 Level 1 requires a minimum of 12 characters. NIST 800-63B recommends checking credentials against breached password lists.

**Fix:** Increase `minPasswordLength` to 12 and consider integrating a HIBP (Have I Been Pwned) check on registration.

---

### H2 — No upper bounds on numeric inputs

**Location:** `src/presentation/dtos/create-product.dto.ts`, `src/presentation/dtos/create-ingredient.dto.ts`  
**OWASP:** A05 (Injection / Validation Failures)  
**ASVS:** 5.1.3

Price and quantity fields use regex patterns but have no `@Max()` constraint. An attacker can submit `9999999999999.99`, potentially overflowing the `numeric(10,2)` database column or corrupting financial calculations.

**Fix:**

```typescript
@IsNumber()
@Min(0.01)
@Max(99999.99)
price: number;
```

---

### H3 — No audit logging for sensitive operations

**Location:** `src/presentation/interceptors/transform.interceptor.ts` (currently empty)  
**OWASP:** A09 (Security Logging and Monitoring Failures)  
**ASVS:** 7.1.1, 7.1.2

There is no middleware or interceptor recording who changed order statuses, who restocked inventory, or who created/deleted users. Security event visibility is zero — undetected compromise is the direct consequence.

**Minimum events to log:** user ID, action, entity type, entity ID, timestamp, outcome (success/failure).

**Fix:** Implement an audit interceptor or a domain event emitter that persists structured logs for every create/update/delete operation.

---

## Medium

### M1 — Detailed validation errors expose API internals

**Location:** `src/presentation/filters/http-exception.filter.ts`  
**OWASP:** A10 (Server-Side Request Forgery / Information Disclosure)  
**ASVS:** 7.4.1

Validation failures return field-level details in all environments:

```json
{
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "email", "message": "must be an email" }]
}
```

This is useful for development but aids enumeration and fingerprinting in production.

**Fix:** In production, return only a generic error code. Log the full field-level detail server-side.

---

### M2 — Inventory overselling race condition

**Location:** `src/application/use-cases/orders/update-order-status.use-case.ts`  
**OWASP:** A04 (Insecure Design)

Inventory is deducted only when an order transitions to `IN_PREPARATION`. Stock is not reserved at order creation time. Two concurrent orders for the same product can both succeed even when only one unit of an ingredient remains.

**Fix:** Reserve inventory atomically at order creation (decrement within the same transaction), or introduce a `reserved_quantity` column and enforce the constraint there.

---

### M3 — Guest orders have no ownership protection

**Location:** `src/presentation/controllers/orders.controller.ts`  
**OWASP:** A01 (Broken Access Control)

`POST /orders` is `@AllowAnonymous()` and creates orders with a nullable `clientId`. If a `GET /orders/:id` route exists without ownership checks, anyone who knows (or guesses via repeated requests) an order UUID can read another user's order.

**Fix:** Confirm that `GET /orders/:id` enforces ownership. For guest orders, issue a short-lived retrieval token (e.g., returned in the creation response or sent by email) rather than relying on UUID obscurity.

---

## Low

### L1 — No CSRF protection

**Location:** `src/main.ts`  
**OWASP:** A01 (Broken Access Control)

The app uses Bearer tokens for the majority of requests (which mitigates most CSRF risk for API clients). However, if the better-auth session cookie plugin is ever enabled, or if the frontend sends cookies alongside requests, CSRF becomes a real attack vector. No `SameSite` or double-submit cookie pattern is configured.

**Fix:** Explicitly set `SameSite=Strict` (or `Lax`) on session cookies and verify the better-auth cookie configuration.

---

## What Is Working Well

- **No SQL injection risk** — All queries use Drizzle's query builder; no raw SQL strings.
- **Strong input validation** — `ValidationPipe` is global with `whitelist: true` and `forbidNonWhitelisted: true`.
- **UUID primary keys** — No sequential ID enumeration possible.
- **RBAC enforced at controller level** — Role decorators are applied consistently.
- **Password hashing** — Delegated to better-auth's crypto module (bcrypt-based); plaintext passwords are never stored.
- **Financial arithmetic** — Decimal libraries used instead of floating point; no precision drift.
- **Parameterized date filters** — `DateRangeDto` uses `@IsDateString()` before values reach the repository.

---

## Priority Fix Order

| # | Action | File | Effort |
|---|--------|------|--------|
| 1 | `app.use(helmet())` | `src/main.ts` | ~5 min |
| 2 | Add `@nestjs/throttler` with auth-route limit | `src/main.ts`, `app.module.ts` | ~30 min |
| 3 | Remove CORS localhost fallback | `src/main.ts` | ~5 min |
| 4 | Add `@Max()` / `@Min()` to price & quantity DTOs | `src/presentation/dtos/` | ~15 min |
| 5 | Increase password minimum length to 12 | `src/infrastructure/auth/better-auth.ts` | ~5 min |
| 6 | Add audit logging interceptor | `src/presentation/interceptors/` | ~1–2 h |
| 7 | Inventory reservation on order creation | `src/application/use-cases/orders/` | ~2–4 h |
