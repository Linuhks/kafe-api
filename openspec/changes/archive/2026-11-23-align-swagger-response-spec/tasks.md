# Tasks

## 1. Spec and dead code

- [x] 1.1 Make sure #10 is merged and this branch is up to date with `master` (`swagger-response-envelope` must have a `## Purpose`). Update that Purpose in `openspec/specs/swagger-response-envelope/spec.md` to describe the real contract: no global envelope; single objects and arrays are returned and documented unwrapped; only paginated lists use `{ data, pagination }`.
- [x] 1.2 Delete `src/presentation/interceptors/transform.interceptor.ts` (confirm there are no importers with `grep -rn transform.interceptor src test`). Remove its line from `src/presentation/CLAUDE.md`. Verify with `pnpm lint && pnpm check && pnpm test` and that `pnpm build` succeeds.

## 2. Tests and verification

- [x] 2.1 Add an E2E case to `test/controllers/products.e2e.spec.ts` (plus one in `orders.e2e.spec.ts` checking that `GET /api/v1/orders/queue` returns a plain array, per the delta spec scenario): create a category and a product as ADMIN, then check that `GET /api/v1/products/:id` returns 200 with `id` at the top level and no `data` key, and that `GET /api/v1/products` returns 200 with `{ data: [...], pagination: { page, limit, total, totalPages } }`. Run `pnpm test:e2e`.
- [x] 2.2 Manual OpenAPI check: boot the app (`pnpm start:dev`), fetch `/api/v1/docs-json`, and confirm that `GET /products/{id}` 200 is `$ref ProductResponseDto`, that `GET /orders/queue` 200 is an array of `OrderResponseDto`, that `DELETE /products/{id}` 204 has no content, and that `data` appears only on the 7 paginated endpoints. Record the result in the PR body.

## 3. Docs and gate

- [x] 3.1 Update `docs/business-rules.md` ("Swagger envelope" → "Swagger response docs" in the cross-cutting list). Check `docs/API.md` and `docs/architecture.md` for envelope mentions.
- [x] 3.2 Isolate the response cache in `E2ETestHelper`: set `REDIS_URL` to `''` before importing `AppModule` (an empty runtime value wins over `.env`, and the app falls back to its per-instance in-memory cache) and restore it on teardown. Verify that `pnpm test:e2e products` passes twice in a row.
- [x] 3.3 Run the full gate (`pnpm lint`, `pnpm check`, `pnpm test`, `pnpm test:e2e`) and `openspec validate align-swagger-response-spec --strict`.
