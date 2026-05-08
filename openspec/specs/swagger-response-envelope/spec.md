## ADDED Requirements

### Requirement: ApiDataResponse decorator wraps single-object responses
The `ApiDataResponse<T>(type, status, isArray?)` decorator SHALL generate a Swagger schema of `{ data: T }` (when `isArray` is false/omitted) or `{ data: T[] }` (when `isArray` is true), matching the envelope applied by `TransformInterceptor`.

#### Scenario: Single-object response documented correctly
- **WHEN** a controller method is decorated with `@ApiDataResponse(SomeDto, 200)`
- **THEN** Swagger documents the 200 response schema as `{ data: SomeDto }`

#### Scenario: Array response documented correctly
- **WHEN** a controller method is decorated with `@ApiDataResponse(SomeDto, 200, true)`
- **THEN** Swagger documents the 200 response schema as `{ data: SomeDto[] }`

#### Scenario: Created response documented correctly
- **WHEN** a controller method is decorated with `@ApiDataResponse(SomeDto, 201)`
- **THEN** Swagger documents the 201 response schema as `{ data: SomeDto }`

### Requirement: ApiPaginatedResponse decorator wraps paginated list responses
The `ApiPaginatedResponse<T>(type)` decorator SHALL generate a Swagger schema of `{ data: T[], pagination: { page: number, limit: number, total: number, totalPages: number } }`, matching the shape returned by paginated use cases and passed through `TransformInterceptor` unchanged.

#### Scenario: Paginated response documented correctly
- **WHEN** a controller method is decorated with `@ApiPaginatedResponse(SomeDto)`
- **THEN** Swagger documents the 200 response schema as `{ data: SomeDto[], pagination: { page, limit, total, totalPages } }`

### Requirement: All controller success responses use envelope decorators
Every controller endpoint that returns a body SHALL use `@ApiDataResponse` or `@ApiPaginatedResponse` for its success status code instead of `@ApiResponse({ type: ... })`. Endpoints returning 204 (no body) and error responses SHALL continue using plain `@ApiResponse`.

#### Scenario: GET single-entity endpoint
- **WHEN** a GET endpoint returns a single entity wrapped by `TransformInterceptor`
- **THEN** its success `@ApiResponse` is replaced with `@ApiDataResponse(EntityDto, 200)`

#### Scenario: POST create endpoint
- **WHEN** a POST endpoint returns the created entity wrapped by `TransformInterceptor`
- **THEN** its success `@ApiResponse` is replaced with `@ApiDataResponse(EntityDto, 201)`

#### Scenario: GET list (non-paginated) endpoint
- **WHEN** a GET endpoint returns a plain array wrapped by `TransformInterceptor`
- **THEN** its success `@ApiResponse` is replaced with `@ApiDataResponse(EntityDto, 200, true)`

#### Scenario: DELETE no-body endpoint
- **WHEN** a DELETE endpoint returns 204 with no body
- **THEN** its `@ApiResponse({ status: 204 })` is kept unchanged
