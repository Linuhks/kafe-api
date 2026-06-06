## 1. Update Husky pre-push hook

- [x] 1.1 Add `pnpm run test:e2e` as a second line in `.husky/pre-push`, after the existing `pnpm run test` line

## 2. Documentation

- [x] 2.1 Add a note in `docs/workflow-dev.md` that a running PostgreSQL instance is required for `git push` (because the pre-push hook runs the e2e suite)
