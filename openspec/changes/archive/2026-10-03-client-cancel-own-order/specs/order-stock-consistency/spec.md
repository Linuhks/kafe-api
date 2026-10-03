## ADDED Requirements

### Requirement: Client cancel and barista start are mutually exclusive
When a client cancellation and a barista move to `IN_PREPARATION` target the same `RECEIVED` order concurrently, exactly one SHALL succeed. If the cancellation wins, no stock SHALL be deducted; if the barista wins, the cancellation SHALL fail and the order SHALL stay `IN_PREPARATION` with its deduction intact.

#### Scenario: Cancel loses to the barista
- **WHEN** the barista's transition to `IN_PREPARATION` commits before the client's cancellation is applied
- **THEN** the client's request fails (409, or 400 if it read the order after the commit), the order remains `IN_PREPARATION` and ingredients are deducted once

#### Scenario: Cancel wins over the barista
- **WHEN** the client's cancellation commits first
- **THEN** the barista's transition fails, the order is `CANCELLED` and no ingredient is deducted
