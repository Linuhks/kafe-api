# Proposal

## Why

`openspec validate --specs --strict` fails 12 of the main specs. None of the failures are about content. The files were written or archived without the structure the spec-driven schema requires:

- 6 specs start with `## ADDED Requirements` (raw delta format copied into the main spec): `docker-build`, `e2e-test-infrastructure`, `orders-seed`, `product-ingredient-seed`, `products-list-filter`, `swagger-response-envelope`.
- 4 specs have `## Requirements` but no title or `## Purpose`: `api-rate-limiting`, `audit-logging`, `product-list-cache`, `security-headers`.
- 1 spec has no section headers at all: `project-documentation`.
- 1 spec has a Purpose that's too short (under 50 characters): `dashboard-analytics`.

Invalid specs make strict validation useless as a gate, because a real problem gets lost among 12 known failures. Some tooling, such as delta sync on archive, also relies on these sections being present.

## What Changes

- Each of the 12 specs gets the standard header: `# <capability> Specification`, then `## Purpose` with a real description of what the capability covers (in the spec's own language), then `## Requirements`.
- `## ADDED Requirements` → `## Requirements` in the 6 delta-format files.
- `dashboard-analytics` gets a fuller Purpose.
- **No requirement or scenario text changes.** The diff is limited to headers and Purpose paragraphs.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. This change makes no behavioural change. Purpose sections can't be changed through delta specs (a delta's `## Purpose` is only read when a capability is created), so the main spec files are edited directly and the change carries no delta specs.

## Impact

- Files: 12 files under `openspec/specs/*/spec.md`. No code, no docs outside `openspec/`.
- After the change, `openspec validate --specs --strict` passes for every spec.

## Security Considerations

Not applicable. No auth, role or user-writable field is touched, and the requirement text is unchanged.

## Verification

`openspec validate --specs --strict` reports 0 failures. `git diff` on `openspec/specs/` shows only header and Purpose lines added or changed, with no edits to any `### Requirement` / `#### Scenario` block. The unit gate (`pnpm lint`, `pnpm check`, `pnpm test`) stays green. The E2E suites aren't affected (no code change) but run anyway in the pre-push hook.
