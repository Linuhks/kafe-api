## Why

The current Docker image starts the application directly with `node dist/main`, but the database schema may not be up to date when the container starts in a new environment. Running migrations automatically on container startup ensures the database is always in sync with the application code before it begins serving requests.

## What Changes

- The container startup command will run Drizzle migrations before launching the application
- A shell entrypoint script will be added to sequence: `migrate → start app`
- The Dockerfile CMD will be replaced with an ENTRYPOINT that calls this script

## Capabilities

### New Capabilities

- `db-migration-on-startup`: Container automatically applies pending Drizzle migrations before the application starts

### Modified Capabilities

- `docker-build`: The container startup behavior changes — `CMD ["node", "dist/main"]` is replaced by an entrypoint script that runs migrations first, then starts the app

## Impact

- `Dockerfile`: ENTRYPOINT/CMD updated to use a startup script
- New `entrypoint.sh` script added to the repository root
- Drizzle migration command (`pnpm run db:migrate` or equivalent) must be available in the production image
- The production image must have access to database credentials at runtime (via environment variables) to run migrations
