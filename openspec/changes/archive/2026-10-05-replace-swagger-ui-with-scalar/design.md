# Design

## Context

`src/main.ts` builds the OpenAPI document with `@nestjs/swagger` and mounts Swagger UI with `SwaggerModule.setup('api/v1/docs', ...)`. Helmet is registered globally with its default CSP (`script-src 'self'`). The app is created with `bodyParser: false` and the global prefix `api/v1`; neither changes here. See `proposal.md` for motivation.

Scalar's NestJS plugin returns an Express handler that renders an HTML page. That page loads the Scalar bundle from `https://cdn.jsdelivr.net/npm/@scalar/api-reference` and starts it with an inline `<script>`. Helmet's default CSP blocks both. The plugin accepts a `nonce` and then emits it on every script tag and on a `csp-nonce` meta tag, and it switches to the single-file bundle so no follow-up module requests need a nonce.

## Goals / Non-Goals

**Goals:**
- Scalar renders at `/api/v1/docs` under a CSP that is no looser than needed.
- The OpenAPI JSON remains available at a stable URL.
- All other routes keep their current security headers.

**Non-Goals:**
- Self-hosting or vendoring the Scalar bundle (see Decisions).
- Gating the docs behind auth or an environment flag.
- Extracting the docs wiring into a testable module or adding E2E coverage for `main.ts`.
- Touching `@ApiDataResponse` / `@ApiPaginatedResponse`; the OpenAPI content is unchanged.

## Decisions

**1. Keep `@nestjs/swagger` for the document, turn off its UI.**
`SwaggerModule.setup('api/v1/docs', app, document, { ui: false, jsonDocumentUrl: 'api/v1/docs-json' })` still registers the JSON route; Scalar then owns the HTML at `/api/v1/docs`.
*Alternative:* `SwaggerModule.setup` with the UI on and Scalar at a second path. Rejected: two docs UIs to maintain and a stale one left reachable.

**2. Scalar mounted with `app.use('/api/v1/docs', handler)`.**
Express path-prefix matching is by segment, so it matches `/api/v1/docs` and `/api/v1/docs/...` but not `/api/v1/docs-json`.
*Alternative:* a Nest controller. Rejected: it would need `@AllowAnonymous()` and a body that bypasses the response interceptors and the audit interceptor, for a static page.

**3. Per-request nonce CSP on the docs route only.**
The handler generates a nonce with `crypto.randomBytes(16)`, sets `Content-Security-Policy` for that response (overriding helmet's header), and passes the same nonce to the plugin. `script-src` is the nonce plus `https://cdn.jsdelivr.net`. `style-src` keeps `'unsafe-inline'` because the bundle injects styles at runtime; `font-src` allows `https://fonts.scalar.com` (the only extra origin a real-browser run showed the page needs; Google Fonts origins were removed as unused), and `connect-src 'self' https://proxy.scalar.com` covers the "try it" client.
*Alternatives:* (a) mount the route before `helmet()` so it has no CSP: rejected, drops all headers on the page. (b) `'unsafe-inline'` in `script-src`: rejected, defeats the CSP. (c) Loosen helmet's CSP globally: rejected, the relaxation would apply to API responses.

**4. Theme and options.**
`theme: 'purple'`, `pageTitle: 'Kafe API'`, `persistAuth: true` so the Bearer token survives reloads. When `theme` is set the plugin does not apply its default red theme. Purely cosmetic and easy to change.

**5. Bundle loaded from the CDN, not vendored.**
Matches the plugin's default and keeps the dependency to one package. The plugin's `cdn` option accepts a pinned URL (for example `https://cdn.jsdelivr.net/npm/@scalar/api-reference@<version>`) if the unpinned `latest` becomes a concern.

## Risks / Trade-offs

- **Unpinned CDN bundle** → a CDN or upstream compromise could run script on the docs origin. Mitigation: nonce plus origin allow-list limits what can load; the page holds no session cookie requirement (Bearer token is user-supplied); pin the version through `cdn` if needed.
- **Docs need internet in the browser** → local dev offline shows a blank page. Mitigation: documented in README; the JSON route still works.
- **CSP too tight for a Scalar feature** (fonts, images, proxy) → part of the page broken. Mitigation: verify in a real browser with the console open (a task), and widen only the specific directive.
- **`style-src 'unsafe-inline'`** → weaker than a fully nonced policy. Accepted: scoped to the docs route, and script execution stays nonce-gated.
- **No automated test covers `main.ts`** → a regression in the wiring would not fail CI. Accepted for this change; manual verification is part of the tasks.
- **Lockfile churn** → pnpm 11 adds `supports-color` peer suffixes across entries. Harmless; noted so reviewers are not surprised.

## Migration Plan

1. Add the dependency and the `main.ts` change.
2. Manual verification (curl and browser).
3. Update docs, run the full gate and `pnpm test:e2e`, open the PR.

Rollback: revert the commit; Swagger UI returns at the same URL. No data or schema migration.
