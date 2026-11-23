# Proposal

## Why

The `swagger-response-envelope` spec describes a design that was reverted the day it shipped:

- The spec (from change `2026-05-07-fix-swagger-response-envelope`) says `TransformInterceptor` wraps every non-paginated success body in `{ data: ... }`, and that controllers document it with an `ApiDataResponse` decorator.
- Commit `672ba3b` (same day) deliberately removed the `{ data }` wrap and deleted `ApiDataResponse` in favour of native `@ApiResponse`. Commit `f2d96fd` later removed the interceptor from `main.ts`. The spec was never updated.

Today the API returns success bodies as-is: the resource itself, an array, or `{ data, pagination }` for paginated lists built by the use cases. The generated OpenAPI documents exactly that. `CLAUDE.md`, `.claude/rules/code-style.md` and `src/presentation/CLAUDE.md` all state "no global envelope". The normative spec is the only source that contradicts the code, and anyone implementing from it would wrap responses and break every client.

What's left in the code is `src/presentation/interceptors/transform.interceptor.ts`: a pass-through class that isn't registered anywhere, with unused `PaginationMeta`/`PaginatedResult` types. `src/presentation/CLAUDE.md` already flags it as a candidate for deletion, and its name keeps the envelope idea alive.

## What Changes

- **Spec `swagger-response-envelope`** (delta):
  - REMOVED: "ApiDataResponse decorator wraps single-object responses".
  - REMOVED: "All controller success responses use envelope decorators".
  - MODIFIED: "ApiPaginatedResponse decorator wraps paginated list responses". The mention of `TransformInterceptor` is dropped, and the requirement becomes the shape of paginated list endpoints only.
  - ADDED: "Success bodies are returned without a global envelope" (runtime behaviour).
  - ADDED: "Success responses are documented with their exact wire shape" (single object, array, paginated, 204).
- **Purpose** of the spec updated in the main file to match (Purpose can't change through a delta).
- **Code**: delete the dead `transform.interceptor.ts` and its entry in `src/presentation/CLAUDE.md`.
- **Tests**: a new E2E case in `products.e2e.spec.ts` asserts the body shape: a single product unwrapped, the list as `{ data, pagination }`.
- **No runtime behaviour change.** Responses and the generated OpenAPI stay the same.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `swagger-response-envelope`: rewritten to describe the actual contract (no global envelope; exact wire shape documented per endpoint).

## Impact

- Spec: `openspec/specs/swagger-response-envelope/spec.md`, through the delta plus a direct Purpose edit. It depends on #10 (which adds the spec's Purpose and headers) being merged first.
- Code: one dead file removed. No controller, DTO or decorator changes.
- Docs: `src/presentation/CLAUDE.md` (drop the interceptor line), `docs/business-rules.md` ("Swagger envelope" → "Swagger response docs" in the cross-cutting list).
- API / OpenAPI: unchanged.

## Security Considerations

Not applicable. No auth, role, endpoint or user-writable field changes. The deleted file is never imported.

## Verification

- `openspec validate align-swagger-response-spec --strict`, and after archive `openspec validate --specs --strict`.
- E2E: a new case in `test/controllers/products.e2e.spec.ts`: `GET /api/v1/products/:id` returns the product at the top level with no `data` key; `GET /api/v1/products` returns `{ data: [...], pagination: { page, limit, total, totalPages } }`. Run `pnpm test:e2e`.
- OpenAPI (manual, since the E2E app doesn't mount Swagger): boot the app, fetch `/api/v1/docs-json`, and confirm that single and array 2xx schemas are the bare DTO / array of DTO, that `data` appears only on the 7 paginated endpoints, and that 204 responses have no body. The same check gives the same result before and after the change.
