## 1. .dockerignore

- [x] 1.1 Create `.dockerignore` at project root excluding `node_modules/`, `dist/`, `.git/`, `coverage/`, `.husky/`, `openspec/`, `*.spec.ts`, `.env`, `.env.*` (keep `.env.example`)

## 2. Dockerfile

- [x] 2.1 Write `builder` stage: `FROM node:22-alpine AS builder`, enable corepack, copy lockfiles, `pnpm install --frozen-lockfile`, copy source, `pnpm run build`
- [x] 2.2 Write `production` stage: `FROM node:22-alpine`, enable corepack, copy lockfiles, `pnpm install --frozen-lockfile --prod`, copy `dist/` from builder, set `NODE_ENV=production`, `EXPOSE 3000`, switch to `USER node`, `CMD ["node", "dist/main"]`

## 3. Validation

- [x] 3.1 Run `docker build -t kafe-api .` and confirm it completes without errors
- [x] 3.2 Run `docker run --rm -p 3000:3000 --env-file .env kafe-api` and confirm `GET /api/v1/docs` returns 200
- [x] 3.3 Verify the final image size is under 300 MB with `docker images kafe-api`
- [x] 3.4 Confirm the container process runs as user `node` (not root) with `docker run --rm kafe-api whoami`
