## Why

The pre-push Husky hook only runs unit tests (`pnpm test`), which means broken e2e tests can be pushed to the remote undetected. Now that the e2e suite is migrated to Vitest and properly isolated, it should act as a gate before every push alongside the unit tests.

## What Changes

- The `.husky/pre-push` hook is updated to run both `pnpm test` and `pnpm test:e2e` in sequence before allowing a push.

## Capabilities

### New Capabilities

_(none — this is a tooling configuration change, no new application capabilities)_

### Modified Capabilities

- `e2e-test-infrastructure`: The e2e test infrastructure is now enforced at push time via Husky, closing the loop on the guard-rail requirement.

## Impact

- `.husky/pre-push`: add `pnpm run test:e2e` after the existing `pnpm run test` line.
- Developers will need a running PostgreSQL instance (already required for e2e) when pushing.
- Push times increase by the duration of the e2e suite; no CI/CD or application code changes required.
