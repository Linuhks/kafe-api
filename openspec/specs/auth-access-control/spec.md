# auth-access-control Specification

## Purpose
Guarantee that account privileges cannot be self-granted or retained after deactivation: clients cannot assign `role`/`isActive` at registration, and deactivated users cannot authenticate.

## Requirements

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

### Requirement: Three roles with fixed capabilities
The system SHALL have roles `ADMIN` (full access: users, menu, ingredients, dashboard), `BARISTA` (order queue, status updates, stock view) and `CLIENT` (places orders, views own history, cancels own order while `RECEIVED`).

#### Scenario: Role restricts access
- **WHEN** a user calls an endpoint outside their role's capabilities
- **THEN** the response is 403

### Requirement: Passwords have at least 12 characters at account creation
The system SHALL reject creating an account with a password shorter than 12 characters, both on public sign-up (`POST /api/auth/sign-up/email`) and on admin creation (`POST /api/v1/users`), with HTTP 400 and no account created. Existing accounts with shorter passwords SHALL still be able to log in.

#### Scenario: Admin creates a user with a short password
- **WHEN** an ADMIN sends `POST /api/v1/users` with an 11-character password
- **THEN** the response is HTTP 400 and no user is created

#### Scenario: Admin creates a user with a 12-character password
- **WHEN** an ADMIN sends `POST /api/v1/users` with a 12-character password
- **THEN** the response is HTTP 201 and the user can log in with that password

#### Scenario: Existing account with a short password
- **WHEN** a user whose password has fewer than 12 characters (created before this rule) logs in with valid credentials
- **THEN** the response is HTTP 200 with a token
