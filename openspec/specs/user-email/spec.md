# user-email Specification

## Purpose

Guarantee that every user account has a valid, normalized email, whichever path created it (Better-Auth sign-up or admin creation): emails are stored trimmed and lowercase, uniqueness is case-insensitive, and login works regardless of the letter case used at creation.

## Requirements

### Requirement: User emails are validated by the domain
The system SHALL reject creating a user whose email, after trimming, is empty, longer than 254 characters, contains whitespace, does not contain exactly one `@`, has an empty local part, or has a domain without a dot. The rejection SHALL be a domain error with code `INVALID_EMAIL` and HTTP status 400, whether or not the request went through the DTO validation.

#### Scenario: Use case called with an invalid email
- **WHEN** `CreateUserUseCase` is executed with email `maria.kafe.com`
- **THEN** it returns `Left(InvalidEmailError)` with code `INVALID_EMAIL` and no user is persisted

#### Scenario: Valid email with surrounding whitespace
- **WHEN** `CreateUserUseCase` is executed with email `  ana@kafe.com  `
- **THEN** the user is created with email `ana@kafe.com`

### Requirement: User emails are stored lowercase
The system SHALL store every user email trimmed and lowercased, whether the user was created through Better-Auth sign-up or by an admin through `POST /api/v1/users`, and SHALL return that normalized value in responses.

#### Scenario: Admin creates a user with a mixed-case email
- **WHEN** an ADMIN sends `POST /api/v1/users` with email `Maria.Case@Kafe.com`
- **THEN** the response is HTTP 201 with email `maria.case@kafe.com`

### Requirement: Email uniqueness is case-insensitive
The system SHALL treat emails that differ only by letter case or surrounding whitespace as the same email. Creating a user with such an email SHALL fail with HTTP 409 and SHALL NOT create a second account.

#### Scenario: Case-variant duplicate
- **WHEN** a user with email `maria@kafe.com` exists and an ADMIN sends `POST /api/v1/users` with email `MARIA@kafe.com`
- **THEN** the response is HTTP 409 and only one account with that email exists

### Requirement: Admin-created users can log in regardless of email case
A user created by an admin SHALL be able to log in through `POST /api/v1/auth/login` with their email in any letter case.

#### Scenario: Login after mixed-case creation
- **WHEN** an ADMIN creates a user with email `Maria.Case@Kafe.com` and that user logs in with `maria.case@kafe.com` or `MARIA.CASE@KAFE.COM` and the correct password
- **THEN** both logins return HTTP 200 with a token

### Requirement: Existing mixed-case emails are normalized
On migration, the system SHALL lowercase and trim existing user emails, except where the normalized value would collide with another user's email. Colliding rows SHALL be left unchanged.

#### Scenario: Legacy mixed-case account
- **WHEN** migrations run on a database with a user `Joao@Kafe.com` and no other user whose normalized email is `joao@kafe.com`
- **THEN** that user's email becomes `joao@kafe.com` and the user can log in

#### Scenario: Colliding legacy accounts
- **WHEN** migrations run on a database with users `Ana@kafe.com` and `ana@kafe.com`
- **THEN** both rows are left unchanged
