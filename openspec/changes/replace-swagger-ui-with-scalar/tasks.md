# Tasks

## 1. Dependency

- [ ] 1.1 Add `@scalar/nestjs-api-reference` with `pnpm add` and verify it appears under `dependencies` in `package.json` and `pnpm install --frozen-lockfile` succeeds

## 2. Serve the API reference with Scalar

- [ ] 2.1 In `src/main.ts`, switch `SwaggerModule.setup` to `{ ui: false, jsonDocumentUrl: 'api/v1/docs-json' }` and verify `curl -s localhost:<port>/api/v1/docs-json` returns JSON with `openapi` and `paths` (spec: raw OpenAPI document)
- [ ] 2.2 In `src/main.ts`, mount the Scalar handler with `app.use('/api/v1/docs', ...)` using theme `purple`, title `Kafe API` and `persistAuth`, and verify `curl -s -D - localhost:<port>/api/v1/docs` returns `200` with `Content-Type: text/html` and no credentials (spec: reference served, publicly reachable)
- [ ] 2.3 Generate a nonce per request (`crypto.randomBytes`), set the docs-only `Content-Security-Policy` and pass the same nonce to the handler; verify with two `curl` calls that the header nonce equals the `<script nonce=...>` values, differs between calls, and `script-src` has no `'unsafe-inline'` (spec: docs CSP)
- [ ] 2.4 Verify an API route and `/api/v1/docs-json` still return helmet's default CSP (`script-src 'self'`) with `curl -s -D -` (spec: relaxed policy is docs-only)
- [ ] 2.5 Open `/api/v1/docs` in a browser with devtools open and verify Scalar renders, all modules' endpoints are listed, there are no CSP errors in the console, and a Bearer token from `POST /api/v1/auth/login` can be set and used on a request. Widen only the specific CSP directive if something is blocked
- [ ] 2.6 Update `README.md`, `docs/API.md` and `CLAUDE.md` to name Scalar at `/api/v1/docs` and the JSON at `/api/v1/docs-json`; verify with `grep -rn -i "swagger ui\|Swagger docs" README.md docs CLAUDE.md` that no stale mention remains
- [ ] 2.7 Run the gate (`pnpm lint`, `pnpm check`, `pnpm test`) and verify all three pass, then commit

## 3. Integration check and PR

- [ ] 3.1 Run `pnpm test:e2e` with `docker compose up -d` and verify all suites pass
- [ ] 3.2 Run `openspec validate replace-swagger-ui-with-scalar --strict` and verify it reports the change valid
- [ ] 3.3 Push the branch (pre-push runs unit + E2E) and open the PR against `master` with `gh pr create`, naming the change `replace-swagger-ui-with-scalar` in the body
