# dashboard-analytics Specification

## Purpose
Management overview aggregates, ADMIN only.

## Requirements

### Requirement: Dashboard exposes summary, top products and peak hours to ADMIN only
The dashboard SHALL provide a summary (order totals, revenue, general metrics), best-selling products by period, and order distribution by hour of day. Non-ADMIN users SHALL be rejected.

#### Scenario: Non-admin access
- **WHEN** a BARISTA or CLIENT requests a dashboard endpoint
- **THEN** the response is 403
