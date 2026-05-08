## Context

The `TransformInterceptor` (registered globally) wraps every controller response in `{ data: value }`, except paginated results which are already in `{ data: T[], pagination: {...} }` shape. Every controller currently documents success responses with `@ApiResponse({ type: SomeDto })`, exposing `SomeDto` directly in Swagger — without the envelope. The `ApiDataResponse` decorator already exists but is not used anywhere. Paginated schemas are inlined manually per-endpoint.

## Goals / Non-Goals

**Goals:**
- Every success response documented in Swagger MUST match the actual wire format.
- Provide reusable decorators for the three response shapes: single-object envelope, array envelope, and paginated envelope.
- Zero runtime behavior changes.

**Non-Goals:**
- Changing error/204 response documentation.
- Altering the `TransformInterceptor` logic.
- Adding new API endpoints.

## Decisions

**D1 — Extend `ApiDataResponse` with `isArray` flag instead of a second decorator**

`ApiDataResponse(SomeDto, 200)` handles `{ data: SomeDto }` and `ApiDataResponse(SomeDto, 200, true)` handles `{ data: SomeDto[] }`. This keeps the single-vs-array distinction at the call site while sharing one implementation.

Alternative: separate `ApiDataArrayResponse` decorator. Rejected — doubles the decorator surface for no real type-safety gain since the controller return type already declares the array.

**D2 — New `ApiPaginatedResponse` decorator for paginated shapes**

Paginated responses (`{ data: T[], pagination: { page, limit, total, totalPages } }`) are a distinct shape from a plain array envelope. A dedicated `ApiPaginatedResponse(SomeDto)` decorator expresses intent clearly and replaces the verbose inline schema present in several controllers.

**D3 — Keep error and 204 `@ApiResponse` calls as plain `@ApiResponse`**

`TransformInterceptor` does not run on error paths (`DomainError` → `HttpExceptionFilter`), and 204 responses have no body. Using `ApiDataResponse` for these would be incorrect.

## Risks / Trade-offs

[Risk] Controllers that return `void` / `undefined` for non-204 endpoints could be silently wrongly documented.
→ Mitigation: Audit every controller endpoint before updating; only change success responses that have a body.

[Risk] Custom inline paginated schemas in `ProductsController.list` and similar may differ slightly from the generic `ApiPaginatedResponse` output.
→ Mitigation: Align inline schemas to the standard decorator; no consumer behavior changes since the schema shape is identical.

## Migration Plan

1. Update `api-data-response.decorator.ts` to accept `isArray` param.
2. Create `api-paginated-response.decorator.ts`.
3. Update controllers one by one; run `pnpm run build` after each to confirm no TS errors.
4. Verify `/api/v1/docs` in the browser against actual API responses.
5. No rollback required — purely additive decorator changes; removing them reverts to previous Swagger output without touching runtime.
