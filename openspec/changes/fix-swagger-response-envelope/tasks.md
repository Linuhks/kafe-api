## 1. Decorators

- [x] 1.1 Update `src/presentation/decorators/api-data-response.decorator.ts` to accept optional `isArray` boolean (3rd param) and generate `{ data: T[] }` schema when true
- [x] 1.2 Create `src/presentation/decorators/api-paginated-response.decorator.ts` with `ApiPaginatedResponse<T>(type)` that generates `{ data: T[], pagination: { page, limit, total, totalPages } }` schema

## 2. ProductsController

- [x] 2.1 Replace inline paginated schema on `GET /products` with `@ApiPaginatedResponse(ProductResponseDto)`
- [x] 2.2 Replace `@ApiResponse({ status: 200, type: ProductResponseDto })` on `GET /products/:id` with `@ApiDataResponse(ProductResponseDto, 200)`
- [x] 2.3 Replace `@ApiResponse({ status: 201, type: ProductResponseDto })` on `POST /products` with `@ApiDataResponse(ProductResponseDto, 201)`
- [x] 2.4 Replace `@ApiResponse({ status: 200, type: ProductResponseDto })` on `PATCH /products/:id` with `@ApiDataResponse(ProductResponseDto, 200)`
- [x] 2.5 Replace `@ApiResponse({ status: 200, type: ProductResponseDto })` on `PATCH /products/:id/availability` with `@ApiDataResponse(ProductResponseDto, 200)`
- [x] 2.6 Replace `@ApiResponse({ status: 201, type: ProductIngredientResponseDto })` on `POST /products/:id/ingredients` with `@ApiDataResponse(ProductIngredientResponseDto, 201)`
- [x] 2.7 Replace `@ApiResponse({ status: 200, type: [ProductIngredientResponseDto] })` on `GET /products/:id/ingredients` with `@ApiDataResponse(ProductIngredientResponseDto, 200, true)`

## 3. CategoriesController

- [x] 3.1 Replace inline paginated schema on `GET /categories` with `@ApiPaginatedResponse(CategoryResponseDto)` (or `@ApiDataResponse(CategoryResponseDto, 200, true)` if non-paginated)
- [x] 3.2 Replace `@ApiResponse({ status: 200, type: CategoryResponseDto })` on `GET /categories/:id` with `@ApiDataResponse(CategoryResponseDto, 200)`
- [x] 3.3 Replace `@ApiResponse({ status: 201, type: CategoryResponseDto })` on `POST /categories` with `@ApiDataResponse(CategoryResponseDto, 201)`
- [x] 3.4 Replace `@ApiResponse({ status: 200, type: CategoryResponseDto })` on `PATCH /categories/:id` with `@ApiDataResponse(CategoryResponseDto, 200)`

## 4. UsersController

- [x] 4.1 Replace inline list response schema on `GET /users` with appropriate `@ApiDataResponse` or `@ApiPaginatedResponse`
- [x] 4.2 Replace `@ApiResponse({ status: 200, type: UserResponseDto })` on `GET /users/:id` with `@ApiDataResponse(UserResponseDto, 200)`
- [x] 4.3 Replace `@ApiResponse({ status: 201, type: UserResponseDto })` on `POST /users` with `@ApiDataResponse(UserResponseDto, 201)`
- [x] 4.4 Replace `@ApiResponse({ status: 200, type: UserResponseDto })` on `PATCH /users/:id` with `@ApiDataResponse(UserResponseDto, 200)`

## 5. OrdersController

- [x] 5.1 Replace `@ApiResponse({ status: 201, type: OrderResponseDto })` on `POST /orders` with `@ApiDataResponse(OrderResponseDto, 201)`
- [x] 5.2 Replace inline paginated schema on `GET /orders` (ADMIN list) with `@ApiPaginatedResponse(OrderResponseDto)`
- [x] 5.3 Replace `@ApiResponse({ status: 200, type: [OrderResponseDto] })` on `GET /orders/queue` with `@ApiDataResponse(OrderResponseDto, 200, true)`; replaced inline paginated schema on `GET /orders/me` with `@ApiPaginatedResponse(OrderResponseDto)`
- [x] 5.4 Replace `@ApiResponse({ status: 200, type: OrderResponseDto })` on `GET /orders/:id` with `@ApiDataResponse(OrderResponseDto, 200)`
- [x] 5.5 Replace `@ApiResponse({ status: 200, type: OrderResponseDto })` on `PATCH /orders/:id/status` with `@ApiDataResponse(OrderResponseDto, 200)`

## 6. InventoryController

- [x] 6.1 Replace inline paginated/list schema on `GET /inventory/movements` with `@ApiPaginatedResponse` or `@ApiDataResponse(..., true)`
- [x] 6.2 Replace `@ApiResponse({ status: 200, type: [IngredientResponseDto] })` on `GET /inventory/alerts` with `@ApiDataResponse(IngredientResponseDto, 200, true)`; replaced inline paginated on `GET /inventory` with `@ApiPaginatedResponse(IngredientResponseDto)`
- [x] 6.3 N/A — no `GET /inventory/ingredients/:id/movements` endpoint exists in the controller
- [x] 6.4 Replace `@ApiResponse({ status: 200, type: IngredientResponseDto })` on `GET /inventory/:id` with `@ApiDataResponse(IngredientResponseDto, 200)`
- [x] 6.5 Replace `@ApiResponse({ status: 201, type: IngredientResponseDto })` on `POST /inventory` with `@ApiDataResponse(IngredientResponseDto, 201)`
- [x] 6.6 Replace `@ApiResponse({ status: 200, type: IngredientResponseDto })` on `PATCH /inventory/:id` with `@ApiDataResponse(IngredientResponseDto, 200)`
- [x] 6.7 Replace `@ApiResponse({ status: 200, type: IngredientResponseDto })` on `POST /inventory/:id/restock` with `@ApiDataResponse(IngredientResponseDto, 200)`

## 7. DashboardController

- [x] 7.1 Replace `@ApiResponse({ status: 200, type: OrderSummaryResponseDto })` on `GET /dashboard/summary` with `@ApiDataResponse(OrderSummaryResponseDto, 200)`
- [x] 7.2 Replace `@ApiResponse({ status: 200, type: [TopProductResponseDto] })` on `GET /dashboard/top-products` with `@ApiDataResponse(TopProductResponseDto, 200, true)`
- [x] 7.3 Replace `@ApiResponse({ status: 200, type: [PeakHourResponseDto] })` on `GET /dashboard/peak-hours` with `@ApiDataResponse(PeakHourResponseDto, 200, true)`

## 8. Verification

- [x] 8.1 Run `pnpm run build` and confirm zero TypeScript errors
- [ ] 8.2 Start the server and open `/api/v1/docs`; verify each endpoint's documented response schema matches the actual JSON returned by the API
