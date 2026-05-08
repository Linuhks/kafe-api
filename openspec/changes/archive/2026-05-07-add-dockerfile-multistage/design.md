## Context

The project is a NestJS API built with TypeScript, compiled via `nest build` into `dist/`. It uses pnpm as its package manager and depends on native addons indirectly (via `pg`). The production entry point is `node dist/main`. There is no existing Dockerfile.

## Goals / Non-Goals

**Goals:**
- Multi-stage Dockerfile that produces the smallest viable image
- `.dockerignore` that keeps the build context minimal
- Final image runs as a non-root user
- Image works out of the box with `docker run` given the right env vars

**Non-Goals:**
- Docker Compose changes for the application (existing `docker-compose.yml` is for the database only)
- CI/CD pipeline integration
- Image publishing or registry configuration
- Secrets management beyond documenting required env vars

## Decisions

### Alpine as base image
Use `node:22-alpine` for both stages.

**Why over distroless**: pnpm and native `pg` module need a shell and `libc` at build time. Alpine keeps the image small (~50 MB compressed) without the friction of distroless for a Node app with native deps.

**Alternatives considered**: `node:22-slim` (Debian) — larger (~80 MB), unnecessary here.

### Two-stage build

**Stage 1 — builder**: `node:22-alpine`
1. Enable pnpm via `corepack enable`
2. Copy `package.json` + `pnpm-lock.yaml`
3. `pnpm install --frozen-lockfile` (all deps, including dev)
4. Copy source
5. `pnpm run build` → produces `dist/`

**Stage 2 — production**: `node:22-alpine`
1. Enable pnpm via `corepack enable`
2. Copy `package.json` + `pnpm-lock.yaml`
3. `pnpm install --frozen-lockfile --prod` (only production deps)
4. Copy `dist/` from builder
5. Drop to non-root user (`node`, built into the base image)
6. `CMD ["node", "dist/main"]`

**Why copy lockfile into prod stage**: avoids a second full install; `--prod` prune is fast and reproducible.

### Non-root user
The `node:alpine` image ships with a `node` user (UID 1000). Switch to it before the final CMD.

**Why**: defense-in-depth; container escapes with root are higher impact.

### Layer ordering for cache
`COPY package.json pnpm-lock.yaml` before `COPY . .` so that dependency install layers are cached across source-only changes.

## Risks / Trade-offs

- **Native addon rebuilds on Alpine** → `node-gyp` may fail if a dep needs build tools. Mitigated by testing build; `pg` uses pre-built binaries and is known to work on Alpine.
- **drizzle-kit in devDependencies** → migrations/seed scripts won't run inside the production image. Acceptable — those run outside the container (e.g., as a separate init job).
- **PORT is runtime env var** → container exposes 3000 by default; callers must map it correctly. Documented via `EXPOSE 3000`.

## Migration Plan

1. Build and smoke-test locally: `docker build -t kafe-api .`
2. Run with required env vars: `docker run -p 3000:3000 --env-file .env kafe-api`
3. Verify `/api/v1/docs` responds
4. Rollback: delete `Dockerfile` and `.dockerignore` — no application changes to revert
