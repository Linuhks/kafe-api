## ADDED Requirements

### Requirement: E2E suites do not share the response cache
Each E2E suite SHALL run its app with a cache that no other suite or run can read, even when `REDIS_URL` is set in the developer's environment. A response cached by one suite or run SHALL never be served to another. The original `REDIS_URL` SHALL be restored on teardown.

#### Scenario: Cached list does not leak into the next run
- **WHEN** a suite creates a product and lists products, and the same suite runs again within the cache TTL against a fresh database
- **THEN** the second run's first `GET /api/v1/products` returns an empty list with `total: 0`

#### Scenario: Environment is restored after teardown
- **WHEN** a suite's `teardown()` completes
- **THEN** `process.env.REDIS_URL` equals the value it held before `setup()` ran
