## Why

The API is production-ready but has no containerization setup, making deployment manual and environment-dependent. A multi-stage Dockerfile with a minimal final image is the standard path to consistent, portable deployments.

## What Changes

- Add `Dockerfile` with multi-stage build (builder + production stage)
- Add `.dockerignore` to exclude dev artifacts and keep build context lean
- Final image based on `node:alpine` distroless-style, containing only compiled output and production `node_modules`

## Capabilities

### New Capabilities

- `docker-build`: Dockerfile and .dockerignore that produce a minimal production image via multi-stage build

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- New files: `Dockerfile`, `.dockerignore` at project root
- No changes to application code or existing configs
- Requires Docker to build/run; no new npm/pnpm dependencies
- Image size target: under 300 MB using Alpine base
