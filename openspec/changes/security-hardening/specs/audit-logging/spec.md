## ADDED Requirements

### Requirement: Mutating operations produce a structured audit log entry
The system SHALL emit a structured audit log entry for every HTTP request that creates, updates, or deletes a resource (POST, PATCH, PUT, DELETE methods).

Each log entry SHALL contain:
- `userId` — the authenticated user's ID, or `"anonymous"` for unauthenticated requests
- `action` — the HTTP method and path (e.g., `POST /api/v1/orders`)
- `entityType` — the resource type derived from the path (e.g., `orders`, `products`)
- `outcome` — `"success"` or `"failure"`
- `statusCode` — the HTTP response status code
- `timestamp` — ISO-8601 UTC timestamp

#### Scenario: Authenticated user creates a resource
- **WHEN** an authenticated user makes a POST request that succeeds
- **THEN** the system SHALL emit an audit log entry with the user's ID, action, entityType, outcome `"success"`, and a 2xx status code

#### Scenario: Unauthenticated request to a mutating endpoint
- **WHEN** an unauthenticated request is made to a POST/PATCH/PUT/DELETE endpoint
- **THEN** the system SHALL emit an audit log entry with `userId: "anonymous"`

#### Scenario: Mutating request that results in an error
- **WHEN** a mutating request fails (4xx or 5xx response)
- **THEN** the system SHALL emit an audit log entry with outcome `"failure"` and the actual status code

---

### Requirement: Read-only requests do not produce audit entries
The system SHALL NOT emit audit log entries for GET or HEAD requests to avoid log flooding.

#### Scenario: GET request produces no audit entry
- **WHEN** a client makes a GET request to any endpoint
- **THEN** no audit log entry SHALL be emitted for that request

---

### Requirement: Audit log write failure does not degrade the API response
The system SHALL handle audit log write errors without propagating them to the HTTP response.

#### Scenario: Logger failure is swallowed
- **WHEN** the audit log write encounters an error
- **THEN** the HTTP response SHALL complete normally and the logger error SHALL be written to stderr only
