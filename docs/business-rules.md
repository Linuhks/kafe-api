# Business Rules

---

## Users and Roles

The system has three roles (`user_role`):

| Role | Description |
|---|---|
| `ADMIN` | Full access: manages users, menu, ingredients, and views the dashboard |
| `BARISTA` | Operates orders: views the queue, updates status, and checks stock |
| `CLIENT` | Places orders and views their own order history |

A user can be active (`isActive: true`) or inactive. Inactive users must not be able to authenticate — this is enforced at session creation by a Better-Auth `databaseHooks.session.create.before` hook that rejects login when `isActive` is `false` (covers both `/api/v1/auth/login` and the native `/api/auth/sign-in/email` route).

`role` and `isActive` are **server-assigned only**. They are declared with `input: false` in the Better-Auth config, so a client cannot set them through the public sign-up endpoint (`POST /api/auth/sign-up/email`) — an attempted `role` is rejected or forced to the default. New sign-ups are always `CLIENT`; role changes happen via direct SQL, the seed, or an authorized admin operation.

---

## Orders

### Lifecycle

Every order starts with status `RECEIVED` and progresses through valid transitions:

```
RECEIVED → IN_PREPARATION → READY → DELIVERED
    ↓              ↓
CANCELLED      CANCELLED
```

Valid transitions by status:

| Current status | Can transition to |
|---|---|
| `RECEIVED` | `IN_PREPARATION`, `CANCELLED` |
| `IN_PREPARATION` | `READY`, `CANCELLED` |
| `READY` | `DELIVERED` |
| `DELIVERED` | — (final state) |
| `CANCELLED` | — (final state) |

Attempting an invalid transition throws `InvalidOrderTransitionError`.

### Order creation

- An order must have at least one item (`OrderItem`)
- Each item references a `Product` and a quantity
- `totalAmount` is calculated based on product prices × quantities
- Order creation **does not deduct stock** — it only validates that products exist and are available

### Stock deduction

Ingredient deduction occurs when the barista advances the order to `IN_PREPARATION`:

- The system calculates the required quantity of each ingredient based on the recipe of each product in the order
- If any ingredient has insufficient stock, the transition fails with `InsufficientStockError` and no deduction is performed
- If stock is sufficient, all ingredients are deducted and a `DEDUCTION` record is created in `inventory_movements`

### Stock refund on cancellation

- Cancelling an order that is `IN_PREPARATION` returns to each ingredient exactly the quantity deducted for that order (summed from the order's `DEDUCTION` movements) and records one `RESTOCK` movement per ingredient, linked to the order (`orderId`) with a note.
- Cancelling a `RECEIVED` order changes no stock (nothing was deducted).
- Orders cancelled before this rule existed were not refunded; correct them manually with an `ADJUSTMENT`.

### Atomicity and concurrency

- The status update, the stock deduction/refund and their movement records commit in a single transaction: if any step fails, nothing is applied.
- The status update is conditional on the status the request was validated against. If another request changed the order first, the request fails (`409 Conflict`, or `400` invalid transition if it read the order after the other committed), so stock is never deducted or refunded twice.
- A recipe that references a missing ingredient makes the `IN_PREPARATION` transition fail with `NotFoundError` instead of being skipped.

> **Note:** stock is not reserved when the order is created. Two simultaneous orders for the same product can both be accepted even if there are only enough ingredients for one.

### Barista queue

The queue endpoint returns orders with status `RECEIVED` and `IN_PREPARATION`, sorted by creation date (oldest first).

---

## Menu

### Categories

- Each category has a `sortOrder` to control display order
- A category can be activated/deactivated (`isActive`)
- A category with linked products cannot be deleted

### Products

- Every product belongs to a category
- A product can be available (`isAvailable: true`) or unavailable
- `ToggleAvailability` flips the availability state of a product
- A product can have zero or more ingredients in its recipe (`product_ingredients`)
- Each product-ingredient link defines the `quantity` of ingredient required per product unit

### Ingredients in the menu

- Ingredients are managed in the inventory module but referenced by the menu via `product_ingredients`
- Adding an ingredient to a product requires both the product and the ingredient to exist

---

## Inventory

### Ingredient stock

- Each ingredient has `currentStock` (current stock) and `minimumStock` (minimum stock)
- Units of measure are freeform (`unit`: e.g. `g`, `ml`, `un`)
- An ingredient is in alert state when `currentStock ≤ minimumStock`

### Movements

Every stock adjustment generates a record in `inventory_movements` with a type (`movement_type`):

| Type | When it occurs |
|---|---|
| `DEDUCTION` | Automatic deduction when an order moves to `IN_PREPARATION` |
| `RESTOCK` | Manual ingredient replenishment, or automatic refund when an `IN_PREPARATION` order is cancelled (has `orderId`) |
| `ADJUSTMENT` | Manual stock correction (physical inventory) |

### Stock alerts

`GetStockAlertsUseCase` returns all ingredients where `currentStock ≤ minimumStock`. Used for operational alerts in the ADMIN/BARISTA panel.

---

## Dashboard

The dashboard module aggregates data for management overview (ADMIN access only):

- **Summary** (`GetSummaryUseCase`): order totals, revenue, and general metrics
- **Top products** (`GetTopProductsUseCase`): best-selling products by period
- **Peak hours** (`GetPeakHoursUseCase`): order distribution by hour of the day
