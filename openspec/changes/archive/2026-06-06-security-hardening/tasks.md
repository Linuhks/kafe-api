## 1. Dependencies and Environment

- [x] 1.1 Install `helmet` and `@nestjs/throttler` packages
- [x] 1.2 Add `CORS_ORIGIN=http://localhost:3001` to `.env.example` with a comment marking it as required in production

## 2. Security Headers (Helmet + CORS)

- [x] 2.1 Import and apply `helmet()` middleware in `src/main.ts` before any route registration
- [x] 2.2 Replace `process.env.CORS_ORIGIN ?? 'http://localhost:3001'` with `configService.getOrThrow<string>('CORS_ORIGIN')` in `src/main.ts`
- [x] 2.3 Verify that `ConfigModule` is available in bootstrap scope (or read env directly with `getOrThrow` equivalent)

## 3. Rate Limiting

- [x] 3.1 Register `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])` in `app.module.ts`
- [x] 3.2 Add `APP_GUARD` provider binding `ThrottlerGuard` globally in `app.module.ts`
- [x] 3.3 Add `@Throttle({ default: { ttl: 60_000, limit: 5 } })` decorator to the auth controller class (covers all `/auth/*` routes)

## 4. Password Policy

- [x] 4.1 Increase `minPasswordLength` from `8` to `12` in `src/infrastructure/auth/better-auth.ts`

## 5. Input Validation Bounds

- [x] 5.1 Add `@Min(0.01)` and `@Max(99999.99)` to the `price` field in `src/presentation/dtos/create-product.dto.ts`
- [x] 5.2 Add `@Min(0)` and `@Max(999999)` to quantity/stock fields in `src/presentation/dtos/create-ingredient.dto.ts`
- [x] 5.3 Check all other numeric DTO fields (e.g., `update-product.dto.ts`, `update-ingredient.dto.ts`) and apply bounds as needed

## 6. Audit Logging Interceptor

- [x] 6.1 Replace the empty `transform.interceptor.ts` with an `AuditInterceptor` that intercepts the response observable
- [x] 6.2 Emit a structured JSON audit entry for POST, PATCH, PUT, DELETE requests containing: `userId`, `action`, `entityType`, `outcome`, `statusCode`, `timestamp`
- [x] 6.3 Extract `userId` from the request's `user` object; fall back to `"anonymous"` if not present
- [x] 6.4 Derive `entityType` from the request path (second segment after `/api/v1/`)
- [x] 6.5 Swallow audit logger errors (catch, write to stderr) so they never propagate to the HTTP response
- [x] 6.6 Ensure the interceptor is registered globally in `app.module.ts` (or `main.ts`)

## 7. Inventory Reservation

- [x] 7.1 Add `deductStockIfSufficient(id: string, quantity: string): Promise<boolean>` to `IIngredientRepository` (returns `true` if stock was sufficient and deducted, `false` if insufficient)
- [x] 7.2 Implement `deductStockIfSufficient` in `DrizzleIngredientRepository` using a single atomic `UPDATE ... WHERE current_stock >= $qty RETURNING id` — return `true` if a row was affected
- [x] 7.3 Implement `deductStockIfSufficient` in `InMemoryIngredientRepository` (fake) using a compare-and-swap: check then deduct only if sufficient, return boolean
- [x] 7.4 Rewrite `DeductForOrderUseCase`: replace the two-pass loop (check loop + deduct loop) with a single pass that calls `deductStockIfSufficient` per ingredient; on `false` return, roll back already-deducted ingredients and return `left(new InsufficientStockError(...))`
- [x] 7.5 Update `DeductForOrderUseCase` unit tests to cover: (a) sufficient stock succeeds, (b) insufficient stock returns `InsufficientStockError`, (c) concurrent scenario — two calls for same single-stock ingredient, only one succeeds

## 8. Session Cookie Hardening

- [x] 8.1 Locate the better-auth cookie configuration in `src/infrastructure/auth/better-auth.ts`
- [x] 8.2 Set `sameSite: 'strict'` and confirm `httpOnly: true` is set on session cookies

## 9. Verification

- [x] 9.1 Run `pnpm run lint` — no new lint errors
- [x] 9.2 Run `pnpm run test` — all unit tests pass
- [x] 9.3 Start the server and verify security headers with `curl -I http://localhost:3000/api/v1/health`
- [x] 9.4 Verify rate limiting by sending 6 rapid auth requests and confirming the 6th returns 429
