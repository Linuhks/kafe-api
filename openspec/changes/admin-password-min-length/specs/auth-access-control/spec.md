## ADDED Requirements

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
