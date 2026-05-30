# Modules

Index of NestJS modules in `kafe-api`. Each module encapsulates a complete feature: controller, use cases, and repositories.

---

## UsersModule

**File:** `src/users.module.ts`

Manages system users. Used by the ADMIN for account administration.

**Use Cases:**

| Use Case | File | Description |
|---|---|---|
| `CreateUserUseCase` | `users/create-user.use-case.ts` | Creates a new user |
| `ListUsersUseCase` | `users/list-users.use-case.ts` | Lists all users |
| `GetUserUseCase` | `users/get-user.use-case.ts` | Fetches a user by ID |
| `UpdateUserUseCase` | `users/update-user.use-case.ts` | Updates user data |
| `DeleteUserUseCase` | `users/delete-user.use-case.ts` | Removes a user |

**Entities:** `User`  
**Repository:** `IUserRepository` → `DrizzleUserRepository`  
**Controller:** `UsersController` (`src/presentation/controllers/users.controller.ts`)

---

## MenuModule

**File:** `src/menu.module.ts`

Manages the menu: categories, products, and the product-ingredient relationship.

**Use Cases — Categories:**

| Use Case | Description |
|---|---|
| `CreateCategoryUseCase` | Creates a new category |
| `ListCategoriesUseCase` | Lists categories (active or all) |
| `GetCategoryUseCase` | Fetches a category by ID |
| `UpdateCategoryUseCase` | Updates category data |
| `DeleteCategoryUseCase` | Removes a category |

**Use Cases — Products:**

| Use Case | Description |
|---|---|
| `CreateProductUseCase` | Creates a product linked to a category |
| `ListProductsUseCase` | Lists products (with availability filters) |
| `GetProductUseCase` | Fetches a product by ID |
| `UpdateProductUseCase` | Updates product data |
| `DeleteProductUseCase` | Removes a product |
| `ToggleAvailabilityUseCase` | Toggles a product's availability |
| `AddProductIngredientUseCase` | Links an ingredient to a product with a quantity |
| `RemoveProductIngredientUseCase` | Removes an ingredient from a product's recipe |
| `ListProductIngredientsUseCase` | Lists a product's ingredients |

**Entities:** `Category`, `Product`, `ProductIngredient`  
**Repositories:** `ICategoryRepository`, `IProductRepository`, `IIngredientRepository`, `IProductIngredientRepository`  
**Controllers:** `CategoriesController`, `ProductsController`

---

## OrdersModule

**File:** `src/orders.module.ts`

Manages the full order lifecycle, from creation to delivery.

**Use Cases:**

| Use Case | Description |
|---|---|
| `CreateOrderUseCase` | Creates an order; validates products and calculates the total |
| `GetOrderUseCase` | Fetches an order by ID |
| `ListOrdersUseCase` | Lists orders (ADMIN: all; CLIENT: own orders) |
| `UpdateOrderStatusUseCase` | Advances order status (validates transition); when moving to `IN_PREPARATION`, calls `DeductForOrderUseCase` to deduct ingredients from stock |
| `GetBaristaQueueUseCase` | Returns the queue of pending orders for the barista |
| `GetMyOrdersUseCase` | Returns the authenticated client's orders |

**Entities:** `Order`, `OrderItem`  
**Repositories:** `IOrderRepository`  
**Controller:** `OrdersController`

> `OrdersModule` imports `MenuModule` to access `IProductRepository` and `InventoryModule` to access `IIngredientRepository` and `IInventoryMovementRepository` when creating orders.

---

## InventoryModule

**File:** `src/inventory.module.ts`

Controls ingredient stock and records all movements.

**Use Cases:**

| Use Case | Description |
|---|---|
| `CreateIngredientUseCase` | Registers a new ingredient |
| `ListIngredientsUseCase` | Lists all ingredients |
| `GetIngredientUseCase` | Fetches an ingredient by ID |
| `UpdateIngredientUseCase` | Updates ingredient data |
| `RestockIngredientUseCase` | Adds stock to an ingredient (generates a `RESTOCK` movement) |
| `DeductForOrderUseCase` | Deducts ingredients from stock for an order (generates `DEDUCTION`) |
| `ListMovementsUseCase` | Lists stock movement history |
| `GetStockAlertsUseCase` | Returns ingredients with stock below the minimum |

**Entities:** `Ingredient`, `InventoryMovement`  
**Repositories:** `IIngredientRepository`, `IInventoryMovementRepository`  
**Controller:** `InventoryController`

---

## DashboardModule

**File:** `src/dashboard.module.ts`

Aggregates metrics and analytical data for the management panel (ADMIN).

**Use Cases:**

| Use Case | Description |
|---|---|
| `GetSummaryUseCase` | Returns order totals, revenue, and period metrics |
| `GetTopProductsUseCase` | Lists best-selling products |
| `GetPeakHoursUseCase` | Order distribution by hour of the day |

**Repositories:** uses `IOrderRepository` (imported from `OrdersModule`)  
**Controller:** `DashboardController`
