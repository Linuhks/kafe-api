## Context

- **Runtime:** controllers return use-case values as-is, except for paginated lists: the use case returns `{ data, total }` and the controller assembles `{ data, pagination: { page, limit, total, totalPages } }`. Everything else returns the entity or an array. No global interceptor is registered (`main.ts` and the E2E helper only register `AuditInterceptor`).
- **Docs:** paginated endpoints use `@ApiPaginatedResponse(Dto)` (7 endpoints), single objects and arrays use `@ApiResponse({ status, type: Dto | [Dto] })`, and 204 responses use `@ApiResponse({ status: 204, description })`. I verified this against the generated `/api/v1/docs-json`.
- **Spec:** `swagger-response-envelope` still requires a `{ data: T }` wrap and an `ApiDataResponse` decorator. Both were removed in `672ba3b`.
- **Dead code:** `presentation/interceptors/transform.interceptor.ts` is a pass-through `TransformInterceptor`, plus `PaginationMeta`/`PaginatedResult` types. Nothing imports it.

## Goals / Non-Goals

**Goals:** the spec states the real contract, the dead envelope artifact is gone, and a test pins the wire shape.

**Non-Goals:** introducing an envelope; changing any response, DTO or decorator; renaming the capability (`swagger-response-envelope` stays as the folder name to keep history and links stable); adding Swagger to the E2E app.

## Decisions

1. **Fix the spec, not the code.** The removal was deliberate (`672ba3b`'s message says so), three repo rule files already document "no global envelope", and the frontend consumes the unwrapped shape. Adding the wrap back would be a breaking change that nobody asked for.
2. **REMOVED + ADDED instead of MODIFIED** for the "use envelope decorators" rule. Its name states the opposite of the new rule, so a rename plus rewrite is clearer as remove-and-add. The paginated requirement keeps its name and is MODIFIED, because its shape is still correct and only the `TransformInterceptor` reference was wrong.
3. **Delete `transform.interceptor.ts` rather than keep it as a no-op.** It has no importers and its name suggests response transformation. `PaginationMeta`/`PaginatedResult` are unused too. If a shared type for the paginated response is needed later, it belongs in the presentation layer next to `ApiPaginatedResponse`, where the shape is assembled, not in an interceptor file.
4. **The wire shape is pinned with E2E, the OpenAPI shape with a manual check.** The E2E helper deliberately doesn't mount Swagger (`e2e-test-infrastructure` spec), so the documented-schema scenarios are verified by fetching `/api/v1/docs-json` from a running app. The runtime scenarios get an E2E test.
5. **The Purpose is edited directly in the main spec**, because a delta's `## Purpose` is ignored for an existing capability. This needs #10 merged first, since #10 is what adds the Purpose section to this spec.

## Risks / Trade-offs

- **Ordering with #10**: if this change is applied before #10 merges, the Purpose edit has nothing to edit. Task 1.1 checks for that and rebases.
- **Capability name** (`…-envelope`) stays slightly misleading. The Purpose explains it, and renaming would churn links in `docs/business-rules.md` and the archive for little gain.

## Open Questions

None.
