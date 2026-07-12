## ADDED Requirements

### Requirement: Privileged user fields are server-assigned only
The system SHALL NOT allow a client to set the `role` or `isActive` fields when registering through the public sign-up endpoint. These fields SHALL be assignable only server-side (database seed, direct SQL, or an authorized admin operation). New users created via sign-up SHALL always receive `role = CLIENT` and `isActive = true` regardless of the request body.

#### Scenario: Sign-up ignores or rejects a client-supplied role
- **WHEN** an anonymous client sends `POST /api/auth/sign-up/email` with a body containing `role: "ADMIN"`
- **THEN** the created user SHALL NOT have `role = ADMIN` — the request SHALL either be rejected with HTTP 400 or the user SHALL be created with `role = CLIENT`

#### Scenario: Sign-up ignores or rejects a client-supplied isActive
- **WHEN** an anonymous client sends `POST /api/auth/sign-up/email` with a body containing `isActive: false`
- **THEN** the created user SHALL be created with `isActive = true` or the request SHALL be rejected with HTTP 400

#### Scenario: Normal sign-up succeeds as CLIENT
- **WHEN** an anonymous client signs up with only `name`, `email`, and `password`
- **THEN** the user SHALL be created successfully with `role = CLIENT` and `isActive = true`

### Requirement: Deactivated users cannot authenticate
The system SHALL reject authentication for any user whose `isActive` is `false`. A deactivated user SHALL NOT receive a session token from the login endpoint and SHALL NOT have a session created on their behalf.

#### Scenario: Deactivated user is denied login
- **WHEN** a user with `isActive = false` submits valid credentials to `POST /api/v1/auth/login`
- **THEN** the server SHALL respond with HTTP 401 and SHALL NOT return a token

#### Scenario: Active user logs in normally
- **WHEN** a user with `isActive = true` submits valid credentials to `POST /api/v1/auth/login`
- **THEN** the server SHALL respond with HTTP 200 and return a valid bearer token
