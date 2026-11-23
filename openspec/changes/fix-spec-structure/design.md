## Context

The spec-driven schema requires every main spec to have `## Purpose` (at least 50 characters, not a placeholder) and `## Requirements`. Twelve specs in `openspec/specs/` were created before or outside the archive flow, or by copying a delta file verbatim, so they lack these sections. The requirement blocks inside them are well formed.

## Goals / Non-Goals

**Goals:** all 12 specs pass `openspec validate --spec --strict`, with Purpose text that tells a reader what each capability covers.

**Non-Goals:** changing any requirement or scenario, reconciling spec content with the current code (some specs have drifted; see Risks), or translating the specs to a single language.

## Decisions

1. **Edit the main specs directly; no delta specs.** A delta's `## Purpose` is ignored for an existing capability, and `## ADDED/MODIFIED Requirements` can only add or replace requirement blocks, not file headers. Archive with `--skip-specs`.
2. **The Purpose is written from the spec's own requirements**, not from the code. It summarises the existing contract and doesn't introduce new rules.
3. **The Purpose follows each spec's language.** The Portuguese specs (`orders-seed`, `product-ingredient-seed`, `product-list-cache`, `products-list-filter`, `project-documentation`) get a Portuguese Purpose, and the rest get English.
4. **Split the long requirement in `audit-logging`.** Strict validation rejects requirement text over 500 characters. The field list moves verbatim into its own requirement with one restating scenario. This is the only edit to requirement content, and it carries no behavioural change.
5. **The header format matches the specs that already pass** (`# <capability> Specification` / `## Purpose` / `## Requirements`), so archive-time tooling sees one consistent shape.

## Risks / Trade-offs

- **Content drift is left in place on purpose.** While writing the Purposes I found requirements that no longer match the code: fixed throttle limits that are now env-configurable (`api-rate-limiting`); a `{ data: T }` envelope and an `ApiDataResponse` decorator that aren't wired (`swagger-response-envelope`); the container CMD (`docker-build`); and the sign-up path under `/api/v1` (`e2e-test-infrastructure`). Each one needs a decision (fix the spec or fix the code) through its own change. Mixing them in here would hide behavioural edits inside a structural diff.

## Open Questions

None.
