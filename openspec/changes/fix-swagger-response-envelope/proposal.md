## Why

The `TransformInterceptor` wraps every non-paginated response in `{ data: ... }` before it reaches the client, but all controllers document their success responses using raw `@ApiResponse({ type: SomeDto })` — so Swagger shows `SomeDto` directly while the real wire format is `{ data: SomeDto }`. This mismatch makes the generated docs unreliable for frontend/mobile consumers.

## What Changes

- Extend `ApiDataResponse` decorator to support `isArray` flag so it can wrap both single-object and array responses in `{ data: [...] }`.
- Create an `ApiPaginatedResponse` decorator to express the existing `{ data: T[], pagination: {...} }` shape in a reusable way.
- Replace raw `@ApiResponse({ type: ... })` success decorators in every controller with the appropriate `ApiDataResponse` or `ApiPaginatedResponse` so that documented schema matches actual wire format.
- Controllers affected: `ProductsController`, `UsersController`, `CategoriesController`, `OrdersController`, `InventoryController`, `DashboardController`.

## Capabilities

### New Capabilities

- `swagger-response-envelope`: Correct Swagger response types to reflect the `{ data: ... }` envelope applied by `TransformInterceptor`, across all controllers.

### Modified Capabilities

- `products-list-filter`: The paginated list response schema is currently inlined; it will be extracted to the new `ApiPaginatedResponse` decorator without changing behavior.

## Impact

- `src/presentation/decorators/api-data-response.decorator.ts` — updated to support `isArray` param.
- New `src/presentation/decorators/api-paginated-response.decorator.ts`.
- All controllers in `src/presentation/controllers/` — success `@ApiResponse` calls replaced; error/204 responses unchanged.
- No runtime behavior changes — interceptor stays the same.
- No breaking changes to the API contract; Swagger docs become more accurate.
