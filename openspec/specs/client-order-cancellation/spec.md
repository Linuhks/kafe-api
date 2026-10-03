# client-order-cancellation Specification

## Purpose
Lets a client cancel their own order via POST /orders/:id/cancel while it is still RECEIVED.

## Requirements

### Requirement: Client can cancel their own order before preparation starts
The system SHALL let an authenticated user cancel an order they own while it is in status `RECEIVED`, via `POST /api/v1/orders/:id/cancel`. On success the order status SHALL become `CANCELLED` and the updated order SHALL be returned. No ingredient stock SHALL change and no inventory movement SHALL be created.

#### Scenario: Owner cancels a RECEIVED order
- **WHEN** an authenticated user sends `POST /api/v1/orders/:id/cancel` for their own `RECEIVED` order
- **THEN** the response is HTTP 200 with the order in status `CANCELLED` and ingredient stock is unchanged

### Requirement: Cancellation is rejected once preparation has started
The system SHALL reject a client cancellation when the order status is anything other than `RECEIVED` and SHALL leave the order and stock unchanged.

#### Scenario: Order already in preparation
- **WHEN** the owner cancels an order in status `IN_PREPARATION`
- **THEN** the response is HTTP 400 (invalid transition for this action) and the order remains `IN_PREPARATION`

#### Scenario: Order already finished or cancelled
- **WHEN** the owner cancels an order in status `READY`, `DELIVERED` or `CANCELLED`
- **THEN** the response is HTTP 400 and the order status is unchanged

### Requirement: Only the owner can cancel through this route
The system SHALL allow cancellation only when the authenticated user is the order's client. For any other user, for an order created anonymously, or for a non-existent order, the system SHALL respond HTTP 404 and SHALL NOT change the order. Unauthenticated requests SHALL be rejected with HTTP 401.

#### Scenario: Another user's order
- **WHEN** an authenticated user cancels an order owned by a different user
- **THEN** the response is HTTP 404 and the order is unchanged

#### Scenario: Anonymous order
- **WHEN** an authenticated user cancels an order that has no client
- **THEN** the response is HTTP 404 and the order is unchanged

#### Scenario: No session
- **WHEN** a request without a valid token calls `POST /api/v1/orders/:id/cancel`
- **THEN** the response is HTTP 401
