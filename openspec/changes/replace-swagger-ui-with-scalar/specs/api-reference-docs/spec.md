# Spec Delta

## Purpose

Defines where the interactive API reference and the raw OpenAPI document are served, who can reach them, and the page-specific security policy the reference needs, so API consumers can explore the API without extra tooling.

## ADDED Requirements

### Requirement: Interactive API reference is served at /api/v1/docs
The system SHALL serve an interactive, browsable API reference as an HTML page at `GET /api/v1/docs`, listing every documented endpoint with its request and response schemas and supporting Bearer authentication.

#### Scenario: Reference page is reachable
- **WHEN** a client requests `GET /api/v1/docs`
- **THEN** the response SHALL be `200` with `Content-Type: text/html`

#### Scenario: Reference is reachable without credentials
- **WHEN** an unauthenticated client requests `GET /api/v1/docs`
- **THEN** the response SHALL be `200`, not `401` or `403`

### Requirement: Raw OpenAPI document is served as JSON
The system SHALL serve the OpenAPI document describing the API as JSON at `GET /api/v1/docs-json`, so tools and clients can consume it. The document SHALL be the same one the interactive reference renders.

#### Scenario: OpenAPI JSON is reachable
- **WHEN** a client requests `GET /api/v1/docs-json`
- **THEN** the response SHALL be `200` with a JSON body that has an `openapi` version field and a `paths` object

#### Scenario: Reference and JSON describe the same API
- **WHEN** an endpoint is added or changed in a controller
- **THEN** it SHALL appear in both the reference page and the JSON document after the next start, with no separate update

### Requirement: Docs page has its own Content-Security-Policy
The `/api/v1/docs` response SHALL carry a `Content-Security-Policy` that allows the page's scripts to run by per-request nonce, without a blanket allowance for inline scripts. A fresh nonce SHALL be generated for each request, and the same nonce SHALL appear on the page's script tags and in the header.

#### Scenario: Nonce matches between header and page
- **WHEN** a client requests `GET /api/v1/docs`
- **THEN** the nonce in the `script-src` directive of the response header SHALL equal the nonce on the page's `<script>` tags

#### Scenario: Nonce changes per request
- **WHEN** a client requests `GET /api/v1/docs` twice
- **THEN** the two responses SHALL carry different nonces

#### Scenario: Scripts do not allow unsafe-inline
- **WHEN** a client requests `GET /api/v1/docs`
- **THEN** the `script-src` directive SHALL NOT contain `'unsafe-inline'`

### Requirement: Relaxed docs policy does not apply to API routes
The Content-Security-Policy required by the docs page SHALL apply only to `/api/v1/docs`. All other routes, including `/api/v1/docs-json`, SHALL keep the default restrictive policy.

#### Scenario: API route keeps the default policy
- **WHEN** a client requests any API route other than `/api/v1/docs`
- **THEN** the response `Content-Security-Policy` SHALL NOT include the docs page's nonce or any CDN origin in `script-src`, and `script-src` SHALL remain `'self'`
