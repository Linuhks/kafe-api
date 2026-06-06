## Requirements

### Requirement: Global rate limit enforced on all endpoints
The system SHALL apply a rate limit of 10 requests per 60 seconds per IP address to all HTTP endpoints.

#### Scenario: Client exceeds global rate limit
- **WHEN** a client sends more than 10 requests within 60 seconds to any endpoint
- **THEN** the server SHALL respond with HTTP 429 Too Many Requests

#### Scenario: Client within global rate limit
- **WHEN** a client sends 10 or fewer requests within 60 seconds
- **THEN** the server SHALL process each request normally

---

### Requirement: Stricter rate limit on authentication endpoints
The system SHALL apply a limit of 5 requests per 60 seconds per IP address on all `/auth/*` routes, overriding the global limit.

#### Scenario: Client exceeds auth-route rate limit
- **WHEN** a client sends more than 5 requests to any `/auth/*` endpoint within 60 seconds
- **THEN** the server SHALL respond with HTTP 429 Too Many Requests

#### Scenario: Auth rate limit resets after window
- **WHEN** 60 seconds have elapsed since the first request in the window
- **THEN** the client's request count SHALL reset and new requests SHALL be accepted

---

### Requirement: Rate limit headers returned in responses
The system SHALL include standard rate-limit headers in all responses so clients can self-throttle.

#### Scenario: Rate limit headers present
- **WHEN** any request is processed
- **THEN** the response SHALL include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers (or equivalent `X-RateLimit-*` headers as configured by the throttler)
