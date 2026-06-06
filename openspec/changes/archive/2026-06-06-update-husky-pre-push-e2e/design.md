## Context

The `.husky/pre-push` hook currently executes a single command: `pnpm run test` (unit tests). The e2e suite (`pnpm test:e2e`) was recently migrated to Vitest with full per-suite database isolation, making it reliable enough to run as a CI gate. Without adding it to the pre-push hook, a developer can push commits that break e2e tests undetected until a CI pipeline runs.

## Goals / Non-Goals

**Goals:**
- Run `pnpm test:e2e` as part of the pre-push Husky hook so broken e2e tests block pushes locally.
- Keep the hook simple and sequential — unit tests first, e2e tests second.

**Non-Goals:**
- Parallelising unit and e2e runs in the hook (not worth the complexity for a local gate).
- Adding environment checks or conditional skipping to the hook (keep it unconditional).
- Modifying CI/CD pipelines (out of scope).

## Decisions

**Sequential execution (unit → e2e)**
Unit tests are fast (~1 s) and catch most regressions immediately; running them first gives quick feedback before the slower e2e suite. Failing fast on unit tests avoids spending time on the e2e run needlessly.

**Single hook file, two lines**
Keeping both commands in `.husky/pre-push` (rather than separate hooks or a shell script) is the simplest solution — Husky executes each line in sequence and exits on the first non-zero exit code, so no extra shell logic is needed.

## Risks / Trade-offs

- **Slower pushes**: e2e tests require a running PostgreSQL instance and take longer than unit tests. Developers without a local database running will see the push fail.  
  → Mitigation: Document the requirement in `docs/workflow-dev.md`; the database is already required for development work.

- **No skip mechanism**: There is no `--no-verify` guard. Developers who need to push without e2e (e.g., docs-only changes) must use `git push --no-verify` explicitly.  
  → Accepted trade-off; abusing `--no-verify` is the developer's explicit choice.
