## ADDED Requirements

### Requirement: Cancelling an in-preparation order refunds ingredient stock
When an order in status `IN_PREPARATION` is moved to `CANCELLED`, the system SHALL add back to each ingredient exactly the quantity that was deducted for that order and SHALL record one `RESTOCK` movement per ingredient with the order's `orderId` and a note identifying the cancellation.

#### Scenario: Cancel from IN_PREPARATION restores stock
- **WHEN** an `IN_PREPARATION` order whose recipe consumed 30 g of coffee is cancelled
- **THEN** the coffee ingredient's `currentStock` increases by 30 g and a `RESTOCK` movement of 30 g with that order's `orderId` exists

#### Scenario: Cancel from RECEIVED changes no stock
- **WHEN** a `RECEIVED` order is cancelled
- **THEN** no ingredient stock changes and no movement is created

#### Scenario: Refund is not repeated
- **WHEN** a `CANCELLED` order receives another status change request
- **THEN** the request is rejected as an invalid transition and no stock changes

### Requirement: Status transition is conditional on the validated status
The system SHALL apply a status update only if the order is still in the status it was validated against. If the status changed in the meantime, the transition SHALL fail with a conflict error and SHALL NOT change stock or movements.

#### Scenario: Concurrent IN_PREPARATION requests deduct once
- **WHEN** two requests move the same `RECEIVED` order to `IN_PREPARATION` at the same time
- **THEN** exactly one succeeds, the other fails (conflict, or invalid transition if it read the order after the first committed), and ingredients are deducted once

### Requirement: Stock changes and status update are atomic
Deduction (or refund), its movement records and the order status update SHALL commit together or not at all.

#### Scenario: Failure during deduction rolls back
- **WHEN** a movement record cannot be written while moving an order to `IN_PREPARATION`
- **THEN** ingredient stock is unchanged, no movements exist for the order and the order remains `RECEIVED`

#### Scenario: Insufficient stock changes nothing
- **WHEN** any ingredient has insufficient stock for the order
- **THEN** the transition fails with `InsufficientStockError`, no ingredient is deducted and the order status is unchanged

### Requirement: Deduction fails on missing ingredients
If a product recipe references an ingredient that does not exist, deduction SHALL fail with a not-found error instead of skipping it.

#### Scenario: Recipe references a missing ingredient
- **WHEN** an order moves to `IN_PREPARATION` and a recipe ingredient no longer exists
- **THEN** the transition fails with `NotFoundError` and no stock is deducted
