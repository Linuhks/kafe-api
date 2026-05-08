## ADDED Requirements

### Requirement: Multi-stage Dockerfile
The project SHALL have a `Dockerfile` at the repository root that uses a multi-stage build: a `builder` stage that compiles TypeScript and a `production` stage that contains only compiled output and production dependencies.

#### Scenario: Builder stage produces compiled output
- **WHEN** the `builder` stage runs `pnpm run build`
- **THEN** a `dist/` directory is produced containing `main.js` and all compiled modules

#### Scenario: Production image excludes dev dependencies
- **WHEN** the final image is built
- **THEN** `node_modules` in the production stage SHALL contain only production dependencies (no devDependencies)

#### Scenario: Production image runs as non-root
- **WHEN** the container starts
- **THEN** the process SHALL run as the `node` user (UID 1000), not root

#### Scenario: Application starts via node directly
- **WHEN** the container is started without arguments
- **THEN** the default CMD SHALL execute `node dist/main`

#### Scenario: Port is declared
- **WHEN** the Dockerfile is inspected
- **THEN** it SHALL declare `EXPOSE 3000`

### Requirement: Minimal .dockerignore
The project SHALL have a `.dockerignore` file at the repository root that excludes all files not needed to build or run the application.

#### Scenario: Build context excludes node_modules
- **WHEN** `docker build` is run
- **THEN** the local `node_modules/` directory SHALL NOT be sent to the daemon

#### Scenario: Build context excludes compiled output
- **WHEN** `docker build` is run
- **THEN** the local `dist/` directory SHALL NOT be sent to the daemon

#### Scenario: Build context excludes test and tooling files
- **WHEN** `docker build` is run
- **THEN** `.git/`, `coverage/`, `.husky/`, `openspec/`, and `*.spec.ts` files SHALL NOT be included in the build context

#### Scenario: Environment files are excluded
- **WHEN** `docker build` is run
- **THEN** `.env` and `.env.*` files (except `.env.example`) SHALL NOT be included in the build context
