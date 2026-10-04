# API

The endpoint reference is **generated from the code** — don't duplicate it here.

- **Swagger UI**: `http://localhost:3333/api/v1/docs`
- **OpenAPI JSON**: `http://localhost:3333/api/v1/docs-json` (this is what `kafe-web` feeds to Orval)
- **Behavior and business rules**: [`openspec/specs/`](../openspec/specs/) (index in [`business-rules.md`](./business-rules.md))

Endpoints, DTOs, auth requirements and error codes live in the controllers' Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@Roles`). Changing an endpoint means updating those decorators — that *is* the documentation update. `test/controllers/swagger.e2e.spec.ts` fails if an operation has no summary or 2xx response, or a protected route has no documented 401.

Below are only the cross-cutting conventions that Swagger doesn't express well.

## Base path and auth

- Base path: `/api/v1`.
- Login: `POST /api/v1/auth/login` → `{ token, user }`, then `Authorization: Bearer <token>`.
- Sign-up is a Better-Auth route **without** the `/v1` prefix: `POST /api/auth/sign-up/email`. It always creates a `CLIENT`.

## Rate limiting

Global limit of 10 requests per 60 s per IP; `POST /auth/login` is limited to 5 per 60 s.

## Pagination

List endpoints accept `page` (default `1`, min 1) and `limit` (default `20`, min 1, max 100) and return:

```json
{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

## Error format

Every error — domain, validation or framework — is shaped by `HttpExceptionFilter`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found",
    "details": [{ "field": "quantity", "message": "must not be less than 1" }],
    "timestamp": "2026-01-01T10:00:00.000Z",
    "path": "/api/v1/orders/123"
  }
}
```

`details` is present only for validation errors (`VALIDATION_ERROR`). Codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409); domain errors carry their own `code`/`statusCode`.
