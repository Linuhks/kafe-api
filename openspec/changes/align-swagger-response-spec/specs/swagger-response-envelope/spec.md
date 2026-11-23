## ADDED Requirements

### Requirement: Success bodies are returned without a global envelope
The system SHALL return a successful response body exactly as the endpoint produces it, with no global wrapper. A single resource SHALL be the resource object itself, and a non-paginated list SHALL be a JSON array. Responses with status 204 SHALL have no body.

#### Scenario: Single resource is returned unwrapped
- **WHEN** a client calls `GET /api/v1/products/:id` for an existing product
- **THEN** the response is HTTP 200 and the body is the product object, with `id` at the top level and no `data` property

#### Scenario: Non-paginated list is returned as an array
- **WHEN** a BARISTA calls `GET /api/v1/orders/queue`
- **THEN** the response is HTTP 200 and the body is a JSON array

### Requirement: Success responses are documented with their exact wire shape
The OpenAPI document SHALL describe each success response with the shape actually returned: the resource schema for a single object, an array of the resource schema for a non-paginated list, the paginated schema for paginated lists, and no body for 204 responses.

#### Scenario: Single-object response documented unwrapped
- **WHEN** the OpenAPI document is generated
- **THEN** the 200 response of `GET /api/v1/products/{id}` references `ProductResponseDto` directly, not an object with a `data` property

#### Scenario: Array response documented as an array
- **WHEN** the OpenAPI document is generated
- **THEN** the 200 response of `GET /api/v1/orders/queue` is an array of `OrderResponseDto`

#### Scenario: No-body response documented without content
- **WHEN** the OpenAPI document is generated
- **THEN** the 204 response of `DELETE /api/v1/products/{id}` has a description and no content schema

## MODIFIED Requirements

### Requirement: ApiPaginatedResponse decorator wraps paginated list responses
Paginated list endpoints SHALL return and document a body of `{ data: T[], pagination: { page: number, limit: number, total: number, totalPages: number } }`. This is the only success shape that contains a `data` property. It is assembled by the endpoint itself, not by a global interceptor, and is documented with the `ApiPaginatedResponse<T>(type)` decorator.

#### Scenario: Paginated response documented correctly
- **WHEN** a controller method is decorated with `@ApiPaginatedResponse(SomeDto)`
- **THEN** Swagger documents the 200 response schema as `{ data: SomeDto[], pagination: { page, limit, total, totalPages } }`

#### Scenario: Paginated response body matches the documented shape
- **WHEN** a client calls `GET /api/v1/products`
- **THEN** the response is HTTP 200 with body `{ data: [...], pagination: { page, limit, total, totalPages } }`

## REMOVED Requirements

### Requirement: ApiDataResponse decorator wraps single-object responses
**Reason**: The `{ data: T }` wrap was removed in commit `672ba3b` (2026-05-07), together with the `ApiDataResponse` decorator. Single objects and arrays are returned and documented unwrapped.
**Migration**: None. The decorator doesn't exist in the code. Document single-object and array responses with `@ApiResponse({ status, type: Dto })` / `type: [Dto]`, as every controller already does.

### Requirement: All controller success responses use envelope decorators
**Reason**: There's no envelope to document beyond the paginated shape. The rule is replaced by "Success responses are documented with their exact wire shape".
**Migration**: None. Controllers already use `@ApiPaginatedResponse` for paginated lists and native `@ApiResponse` for everything else.
