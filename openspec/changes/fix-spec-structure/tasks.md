# Tasks

## 1. Fix spec structure

- [x] 1.1 Rename `## ADDED Requirements` → `## Requirements` and add the title and `## Purpose` in `docker-build`, `e2e-test-infrastructure`, `orders-seed`, `product-ingredient-seed`, `products-list-filter`, `swagger-response-envelope`.
- [x] 1.2 Add the title and `## Purpose` to `api-rate-limiting`, `audit-logging`, `product-list-cache`, `security-headers`; add the title, `## Purpose` and `## Requirements` to `project-documentation`; expand the Purpose of `dashboard-analytics`; split the over-long first requirement of `audit-logging` (field list moved verbatim into its own requirement).
- [x] 1.3 Verify: `openspec validate --specs --strict` reports 0 failures; `git diff openspec/specs/` touches only header and Purpose lines, apart from the `audit-logging` split; `pnpm lint`, `pnpm check` and `pnpm test` pass. No E2E run is needed because there is no code change (the pre-push hook runs it anyway).
