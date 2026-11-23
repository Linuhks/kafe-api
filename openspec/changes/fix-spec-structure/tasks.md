# Tasks

## 1. Fix spec structure

- [ ] 1.1 Rename `## ADDED Requirements` → `## Requirements` and add the title and `## Purpose` in `docker-build`, `e2e-test-infrastructure`, `orders-seed`, `product-ingredient-seed`, `products-list-filter`, `swagger-response-envelope`.
- [ ] 1.2 Add the title and `## Purpose` to `api-rate-limiting`, `audit-logging`, `product-list-cache`, `security-headers`; add the title, `## Purpose` and `## Requirements` to `project-documentation`; expand the Purpose of `dashboard-analytics`.
- [ ] 1.3 Verify: `openspec validate --specs --strict` reports 0 failures; `git diff openspec/specs/` touches only header and Purpose lines (no `### Requirement` / `#### Scenario` edits); `pnpm lint`, `pnpm check` and `pnpm test` pass. No E2E run is needed because there is no code change (the pre-push hook runs it anyway).
