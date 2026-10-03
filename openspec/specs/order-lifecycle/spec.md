# order-lifecycle Specification

## Purpose
Defines how an order is created, which status transitions are valid, and what the barista queue shows. Stock effects of transitions live in `order-stock-consistency`; client self-cancellation in `client-order-cancellation`.

## Requirements

### Requirement: Orders start as RECEIVED and follow a fixed state machine
Every order SHALL start in status `RECEIVED`. Valid transitions SHALL be exactly: `RECEIVED → IN_PREPARATION | CANCELLED`, `IN_PREPARATION → READY | CANCELLED`, `READY → DELIVERED`. `DELIVERED` and `CANCELLED` are final. Any other transition SHALL fail with `InvalidOrderTransitionError`.

#### Scenario: Valid transition
- **WHEN** a barista moves a `RECEIVED` order to `IN_PREPARATION`
- **THEN** the order status becomes `IN_PREPARATION`

#### Scenario: Invalid transition
- **WHEN** an order in `READY` is moved to `CANCELLED`, or a `DELIVERED` order to any status
- **THEN** the request fails with `InvalidOrderTransitionError` and the order is unchanged

### Requirement: Order creation validates items and does not touch stock
An order SHALL have at least one item, each referencing an existing, available product and a quantity. `totalAmount` SHALL be the sum of product price × quantity. Creation SHALL NOT deduct or reserve stock. Two simultaneous orders MAY both be accepted even if ingredients only cover one.

#### Scenario: Order without items
- **WHEN** an order is created with no items
- **THEN** the request is rejected

#### Scenario: Unknown or unavailable product
- **WHEN** an item references a non-existent product (404) or an unavailable one (409)
- **THEN** no order is created

#### Scenario: Creation leaves stock untouched
- **WHEN** a valid order is created
- **THEN** it is `RECEIVED`, `totalAmount` is price × quantity summed, and no ingredient stock changes

### Requirement: Barista queue lists open orders oldest first
The queue SHALL return orders in `RECEIVED` and `IN_PREPARATION`, sorted by creation date ascending.

#### Scenario: Queue content
- **WHEN** the queue is requested
- **THEN** only `RECEIVED` and `IN_PREPARATION` orders are returned, oldest first
