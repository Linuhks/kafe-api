## MODIFIED Requirements

### Requirement: Multi-stage Dockerfile
The project SHALL have a `Dockerfile` at the repository root that uses a multi-stage build: a `builder` stage that compiles TypeScript and a `production` stage that contains compiled output, production dependencies, SQL migration files, and the entrypoint script.

#### Scenario: Builder stage produces compiled output
- **WHEN** the `builder` stage runs `pnpm run build`
- **THEN** a `dist/` directory is produced containing `main.js`, `migrate.js`, and all compiled modules

#### Scenario: Production image excludes dev dependencies
- **WHEN** the final image is built
- **THEN** `node_modules` in the production stage SHALL contain only production dependencies (no devDependencies)

#### Scenario: Production image contains migration SQL files
- **WHEN** the final image is built
- **THEN** the directory `./migrations/` SHALL contain all `.sql` files from `src/infrastructure/db/migrations/`

#### Scenario: Production image contains the entrypoint script
- **WHEN** the final image is built
- **THEN** `entrypoint.sh` SHALL be present and executable in the working directory

#### Scenario: Production image runs as non-root
- **WHEN** the container starts
- **THEN** the process SHALL run as the `node` user (UID 1000), not root

#### Scenario: Application starts via entrypoint
- **WHEN** the container is started without arguments
- **THEN** the default entrypoint SHALL execute `entrypoint.sh`, which runs migrations then starts `node dist/src/main`

#### Scenario: Port is declared
- **WHEN** the Dockerfile is inspected
- **THEN** it SHALL declare `EXPOSE 3000`
