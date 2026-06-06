## ADDED Requirements

### Requirement: E2E suite runs as a Husky pre-push gate
The `.husky/pre-push` hook SHALL execute `pnpm run test:e2e` after `pnpm run test`. Both commands SHALL run sequentially; a non-zero exit from either SHALL abort the push. No conditional skipping logic SHALL be added to the hook.

#### Scenario: Push is blocked when e2e tests fail
- **WHEN** a developer runs `git push` and at least one e2e test fails
- **THEN** the push is aborted and the terminal shows the Vitest failure output

#### Scenario: Push succeeds when both unit and e2e tests pass
- **WHEN** a developer runs `git push` and all unit tests and all e2e tests pass
- **THEN** the push completes successfully

#### Scenario: Unit test failure prevents e2e run
- **WHEN** a developer runs `git push` and a unit test fails
- **THEN** `pnpm run test:e2e` is NOT executed and the push is aborted after the unit test failure
