## Context

The production Docker image currently starts with `CMD ["node", "dist/src/main"]`. There is no mechanism to apply pending Drizzle migrations before the app starts. The `db:migrate` script depends on `drizzle-kit`, which is a dev dependency and is not present in the production image.

Migration SQL files live at `src/infrastructure/db/migrations/` and are not currently copied into the production image (only `dist/` is copied).

## Goals / Non-Goals

**Goals:**
- Automatically run pending migrations when a container starts, before serving traffic
- Keep the production image minimal (no dev tooling)
- Fail fast: if migrations fail, the container exits with a non-zero code so orchestration (Docker Compose, k8s) can detect and surface the error

**Non-Goals:**
- Generating new migrations (that remains a local dev task via `drizzle-kit generate`)
- Running seeds automatically on startup
- Supporting rollbacks (Drizzle's migration model is forward-only)

## Decisions

### Use `drizzle-orm`'s built-in migrator, not `drizzle-kit`

`drizzle-orm` ships a `migrate()` function (`drizzle-orm/postgres-js/migrator`) that applies SQL files from a directory. This is available in production without `drizzle-kit`.

A `src/migrate.ts` file will be added, compiled to `dist/src/migrate.js`, and run before the main app starts. This avoids adding any dev dependency to the production image.

**Alternative considered**: Move `drizzle-kit` to regular dependencies. Rejected — it adds ~30 MB of build tooling to every production container for a task that only requires reading SQL files.

### Copy SQL migration files into the production image

The migrator reads raw `.sql` files at runtime, so they must be present in the production container. A `COPY` instruction will bring `src/infrastructure/db/migrations/` into the image at a fixed path (`./migrations/`).

**Alternative considered**: Embed migration SQL strings in compiled output. Rejected — this would require a custom Drizzle plugin and is fragile.

### Use an `entrypoint.sh` shell script to sequence migrate → start

An `entrypoint.sh` at the repository root will:
1. Run `node dist/src/migrate.js` — exits non-zero on failure (container stops)
2. `exec node dist/src/main` — replaces the shell process, so signals are forwarded correctly

**Alternative considered**: Inline the sequence in `CMD ["sh", "-c", "..."]`. Rejected — harder to read, harder to extend (e.g., adding health checks later), and `exec` semantics are easy to forget inline.

## Risks / Trade-offs

- [Migration takes too long under load] → The container won't serve traffic until migrations complete. For long migrations on large tables, this causes a startup delay. Mitigation: design migrations to be backward-compatible and fast (avoid locks on large tables).
- [Concurrent migrations on multi-replica deploy] → Multiple containers starting at the same time may race to apply the same migration. Drizzle's migrator uses an advisory lock (`__drizzle_migrations` table + `pg_advisory_lock`), so concurrent runs are safe — only one will apply; others wait.
- [Database not reachable at startup] → The migrate script will fail and the container will exit. Orchestrators (k8s readiness probes, Docker Compose `depends_on: condition: service_healthy`) should ensure the DB is healthy before starting the app container.

## Migration Plan

1. Add `src/migrate.ts` (TypeScript migration runner)
2. Add `entrypoint.sh` to repository root
3. Update `Dockerfile` to:
   - Copy migration SQL files into the production image
   - Replace `CMD` with `ENTRYPOINT`/`CMD` pointing to the entrypoint script
4. Verify locally: `docker build` + `docker run` with a live Postgres instance
