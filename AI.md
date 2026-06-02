# AI.md

This file documents how AI tooling was used during the development of `kafe-api`. It is not a promotional document. It exists so that contributors and reviewers understand what was AI-generated, what was manually designed, and where human judgment was the deciding factor.

---

## Workflow Overview

Development followed a structured, three-layer AI-assisted workflow:

1. **Taskmaster** — used at project kickoff to translate a PRD into a sequenced task list
2. **OpenSpec (opsx)** — used per-feature to produce a proposal, design, and task breakdown before any code was written
3. **Claude Code** — used as the underlying model for code generation, architecture decisions, and documentation

Each tool had a defined role. They were not used interchangeably or ad hoc.

---

## Taskmaster

### What it does

Taskmaster takes a Product Requirements Document (PRD) as input and produces a numbered, dependency-ordered list of tasks and subtasks covering the full implementation scope.

### When it was used

At project kickoff, before writing any code. The PRD described the full system: domain entities (`Order`, `Product`, `Ingredient`, `InventoryMovement`), use cases per module, role-based access rules, and technical constraints (NestJS, Drizzle ORM, Better Auth, PostgreSQL, Docker, CI/CD).

Taskmaster decomposed that document into a flat, ordered task list with explicit dependencies — which module had to exist before another could be wired, which use cases had to be implemented before the controller layer could be built.

### Example

The PRD specified that the order flow required stock deduction when an order transitions to `IN_PREPARATION`. Taskmaster broke this into distinct subtasks:

- Implement `UpdateOrderStatusUseCase` with transition validation
- Implement ingredient deduction logic inside the status transition
- Implement `InsufficientStockError` domain error
- Write unit tests using in-memory repositories

This sequencing meant the domain layer was always implemented before the infrastructure layer depended on it — which matched the clean architecture constraint that domain has no framework dependencies.

---

## OpenSpec (opsx)

### What it does

OpenSpec is a structured proposal workflow for individual changes. Each change goes through three phases before implementation begins:

- `/opsx:propose` — generates `proposal.md`, `design.md`, and `tasks.md` for a described change
- `/opsx:apply` — implements the tasks in sequence, running the quality gate after each subtask
- `/opsx:archive` — moves the completed change to the archive once all tasks are done

All artifacts live under `openspec/changes/<change-name>/`.

### When it was used

For every non-trivial feature, refactor, or fix throughout development. The proposal step forced scope to be defined before code was written. If the proposal was wrong, it was corrected before any implementation happened — not after.

### Example

The `security-hardening` change addressed several issues identified in a security review. Before any code was touched, `/opsx:propose` produced a `proposal.md` that listed:

- Rate limiting via `@nestjs/throttler` with a stricter limit on the auth route
- Security headers via `helmet`
- CORS strict origin (no localhost fallback in production)
- Minimum password length increase (8 → 12)
- Numeric bounds (`@Max`/`@Min`) on price and quantity DTOs
- Audit logging interceptor for mutating operations

Each item was scoped to specific files in the proposal before `design.md` was written. This made the implementation deterministic: the developer (and the AI) had a written contract of what the change included and what it explicitly did not include.

Another example: `swagger-response-envelope` refactored inline Swagger schemas into a reusable `ApiPaginatedResponse` decorator. The proposal identified every controller that would be affected before the refactor started, preventing partial changes.

---

## Claude Code

### What it does

Claude Code is the AI model used inside both Taskmaster and OpenSpec. It was configured as the primary model (`claude-sonnet`) for code generation, architecture decisions, and documentation.

### When it was used

Throughout the entire project — for generating use case implementations, writing unit tests with in-memory repositories, producing Drizzle schema definitions, wiring NestJS modules, and writing documentation files including this one.

Claude Code operated within the constraints defined in `CLAUDE.md` and the layer-specific `CLAUDE.md` files (`src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/`). Those files encode architectural invariants that the model was expected to follow: no framework imports in the domain layer, use cases must have a sibling spec file, no `any`, `Either<L, R>` for recoverable errors rather than throwing.

A mandatory quality gate ran after every subtask and every completed task:

```bash
pnpm lint    # Biome linter with auto-fix
pnpm check   # Biome full check with auto-fix
pnpm test    # Vitest unit tests
```

All three had to pass before a commit was created. This gate was not optional and applied regardless of whether the change was small or large.

---

## Human Oversight

The following were never delegated to AI without explicit human review:

**Business rules** — the domain rules in `docs/business-rules.md` (order state machine, stock deduction timing, role permissions) were written and validated by the developer. AI implemented what the rules specified; it did not define the rules.

**Security decisions** — the security review that produced the `security-hardening` change was conducted by a human. The AI implemented the mitigations described in the proposal. Decisions about what constituted an acceptable risk level, what to rate-limit, and what to log were made by the developer.

**Database migrations** — Drizzle schema changes were reviewed manually before being applied. The auto-migration behavior on container startup (`docs/architecture.md`) was a deliberate architectural decision, not an AI recommendation adopted uncritically.

**Dependency selection** — choices like Better Auth over a custom JWT implementation, Biome over ESLint + Prettier, and Drizzle over TypeORM were made before AI tooling was involved in implementation.

**Code review** — every AI-generated diff was read before being committed. The quality gate (lint + check + test) was a minimum bar, not a substitute for reading the output.

---

## Lessons Learned

**Proposals before code is not overhead.** The time spent on `proposal.md` and `design.md` consistently reduced implementation time. When scope was written down before coding started, there were fewer mid-implementation course corrections.

**Layer-specific CLAUDE.md files work.** Encoding architectural constraints directly in the files that Claude Code reads — rather than repeating them in every prompt — kept generated code consistent with the architecture across the full project.

**The quality gate needs to be mandatory, not advisory.** When it was treated as a checkpoint that could be skipped "just this once," it wasn't a gate anymore. Treating it as a hard stop before every commit caught regressions early.

**AI-generated tests require the same review as AI-generated code.** Tests that pass but test the wrong thing are worse than no tests. In-memory repository implementations used in unit tests were reviewed as carefully as the use cases they tested.

**Proposals drift from implementation.** `tasks.md` files sometimes described what was planned, not what was actually done. The archive step (`/opsx:archive`) was useful for noting divergences, but the proposal artifacts should not be treated as implementation ground truth after the change is done — the code is.
