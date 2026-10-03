# inventory-management Specification

## Purpose
Ingredient stock, units, alerts and the movement ledger. Deduction/refund tied to orders is specified in `order-stock-consistency`.

## Requirements

### Requirement: Ingredients track current and minimum stock
Each ingredient SHALL have `currentStock`, `minimumStock` and a freeform `unit` (e.g. `g`, `ml`, `un`). An ingredient is in alert state when `currentStock ≤ minimumStock`.

#### Scenario: Stock alerts
- **WHEN** stock alerts are requested
- **THEN** every ingredient with `currentStock ≤ minimumStock` is returned (ADMIN and BARISTA)

### Requirement: Every stock change is recorded as a movement
Each stock change SHALL create an `inventory_movements` record of type `DEDUCTION` (order moved to `IN_PREPARATION`), `RESTOCK` (manual replenishment, or automatic refund on cancelling an `IN_PREPARATION` order, which carries the `orderId`) or `ADJUSTMENT` (manual correction after a physical count).

#### Scenario: Manual restock
- **WHEN** an admin restocks an ingredient
- **THEN** `currentStock` increases and a `RESTOCK` movement is recorded
