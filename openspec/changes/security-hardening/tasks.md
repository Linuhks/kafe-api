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

- [ ] 7.1 In `CreateOrderUseCase`, wrap the ingredient stock check and inventory decrement in the same Drizzle transaction as the order insert
- [ ] 7.2 If any ingredient has insufficient stock, roll back the transaction and throw a domain error
- [ ] 7.3 Add a unit test covering the concurrent-order scenario (two orders for the same single-stock ingredient — only one should succeed)

## 8. Session Cookie Hardening

- [x] 8.1 Locate the better-auth cookie configuration in `src/infrastructure/auth/better-auth.ts`
- [x] 8.2 Set `sameSite: 'strict'` and confirm `httpOnly: true` is set on session cookies

## 9. Verification

- [x] 9.1 Run `pnpm run lint` — no new lint errors
- [x] 9.2 Run `pnpm run test` — all unit tests pass
- [ ] 9.3 Start the server and verify security headers with `curl -I http://localhost:3000/api/v1/health`
- [ ] 9.4 Verify rate limiting by sending 6 rapid auth requests and confirming the 6th returns 429
