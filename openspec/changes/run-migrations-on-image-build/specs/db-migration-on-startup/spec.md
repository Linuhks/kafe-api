## ADDED Requirements

### Requirement: Migration runner script
The project SHALL include a `src/migrate.ts` file that applies all pending Drizzle SQL migrations using `drizzle-orm`'s built-in migrator, then exits.

#### Scenario: Successful migration run
- **WHEN** `node dist/src/migrate.js` is executed with a valid `DATABASE_URL` environment variable
- **THEN** all pending SQL files in the migrations folder SHALL be applied and the process SHALL exit with code 0

#### Scenario: Migration failure exits non-zero
- **WHEN** `node dist/src/migrate.js` is executed and a migration fails (e.g., DB unreachable, SQL error)
- **THEN** the process SHALL log the error and exit with a non-zero exit code

### Requirement: Container entrypoint script
The project SHALL include an `entrypoint.sh` script at the repository root that runs migrations then starts the application.

#### Scenario: Migrations succeed before app start
- **WHEN** the container starts and all migrations apply successfully
- **THEN** `node dist/src/main` SHALL start immediately after migration completes

#### Scenario: Migrations fail — app does not start
- **WHEN** the container starts and the migration script exits with a non-zero code
- **THEN** `node dist/src/main` SHALL NOT be started and the container SHALL exit with a non-zero code

#### Scenario: Signals are forwarded to the application process
- **WHEN** the container receives SIGTERM
- **THEN** the signal SHALL be delivered to the `node dist/src/main` process (via `exec`) so it can shut down gracefully
