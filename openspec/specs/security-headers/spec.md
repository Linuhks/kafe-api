## Requirements

### Requirement: Security headers set on every HTTP response
The system SHALL include the following HTTP security headers on every response, including error responses:

- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `Strict-Transport-Security: max-age=15552000; includeSubDomains` — enforces HTTPS
- `Content-Security-Policy` — restricts resource loading origins

#### Scenario: Security headers present on successful response
- **WHEN** a client makes any successful API request
- **THEN** the response SHALL include `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` headers

#### Scenario: Security headers present on error response
- **WHEN** the server returns an error response (4xx or 5xx)
- **THEN** the response SHALL still include all security headers

---

### Requirement: CORS origin is required and has no default fallback
The system SHALL reject startup if the `CORS_ORIGIN` environment variable is not set, rather than silently defaulting to any origin.

#### Scenario: Missing CORS_ORIGIN causes startup failure
- **WHEN** the application starts without `CORS_ORIGIN` defined in the environment
- **THEN** the application SHALL throw a configuration error and exit before accepting connections

#### Scenario: Valid CORS_ORIGIN permits matching origin
- **WHEN** `CORS_ORIGIN` is set to a specific origin and a request arrives from that origin
- **THEN** the server SHALL include the appropriate `Access-Control-Allow-Origin` header

#### Scenario: Request from disallowed origin is rejected
- **WHEN** a request arrives from an origin that does not match `CORS_ORIGIN`
- **THEN** the server SHALL not include `Access-Control-Allow-Origin` for that origin

---

### Requirement: Session cookies use SameSite=Strict
If session cookies are issued, the system SHALL set `SameSite=Strict` to prevent cross-site request forgery.

#### Scenario: Session cookie includes SameSite attribute
- **WHEN** the server issues a session cookie via better-auth
- **THEN** the cookie SHALL have `SameSite=Strict` and `HttpOnly` attributes set
