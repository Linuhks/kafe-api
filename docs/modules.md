# Módulos

Índice dos módulos NestJS do `kafe-api`. Cada módulo encapsula uma feature completa: controller, use cases e repositórios.

---

## UsersModule

**Arquivo:** `src/users.module.ts`

Gerencia usuários do sistema. Usado pelo ADMIN para administração de contas.

**Use Cases:**

| Use Case | Arquivo | Descrição |
|---|---|---|
| `CreateUserUseCase` | `users/create-user.use-case.ts` | Cria um novo usuário |
| `ListUsersUseCase` | `users/list-users.use-case.ts` | Lista todos os usuários |
| `GetUserUseCase` | `users/get-user.use-case.ts` | Busca um usuário por ID |
| `UpdateUserUseCase` | `users/update-user.use-case.ts` | Atualiza dados de um usuário |
| `DeleteUserUseCase` | `users/delete-user.use-case.ts` | Remove um usuário |

**Entidades:** `User`
**Repositório:** `IUserRepository` → `DrizzleUserRepository`
**Controller:** `UsersController` (`src/presentation/controllers/users.controller.ts`)

---

## MenuModule

**Arquivo:** `src/menu.module.ts`

Gerencia o cardápio: categorias, produtos e a relação produto-ingrediente.

**Use Cases — Categorias:**

| Use Case | Descrição |
|---|---|
| `CreateCategoryUseCase` | Cria uma nova categoria |
| `ListCategoriesUseCase` | Lista categorias (ativas ou todas) |
| `GetCategoryUseCase` | Busca categoria por ID |
| `UpdateCategoryUseCase` | Atualiza dados de uma categoria |
| `DeleteCategoryUseCase` | Remove uma categoria |

**Use Cases — Produtos:**

| Use Case | Descrição |
|---|---|
| `CreateProductUseCase` | Cria um produto vinculado a uma categoria |
| `ListProductsUseCase` | Lista produtos (com filtros de disponibilidade) |
| `GetProductUseCase` | Busca produto por ID |
| `UpdateProductUseCase` | Atualiza dados de um produto |
| `DeleteProductUseCase` | Remove um produto |
| `ToggleAvailabilityUseCase` | Ativa/desativa disponibilidade de um produto |
| `AddProductIngredientUseCase` | Vincula um ingrediente a um produto com quantidade |
| `RemoveProductIngredientUseCase` | Remove um ingrediente da receita de um produto |
| `ListProductIngredientsUseCase` | Lista ingredientes de um produto |

**Entidades:** `Category`, `Product`, `ProductIngredient`
**Repositórios:** `ICategoryRepository`, `IProductRepository`, `IIngredientRepository`, `IProductIngredientRepository`
**Controllers:** `CategoriesController`, `ProductsController`

---

## OrdersModule

**Arquivo:** `src/orders.module.ts`

Gerencia o ciclo de vida dos pedidos, desde a criação até a entrega.

**Use Cases:**

| Use Case | Descrição |
|---|---|
| `CreateOrderUseCase` | Cria um pedido; valida produtos e calcula o total |
| `GetOrderUseCase` | Busca um pedido por ID |
| `ListOrdersUseCase` | Lista pedidos (ADMIN: todos; CLIENT: os próprios) |
| `UpdateOrderStatusUseCase` | Avança o status de um pedido (valida transição); ao passar para `IN_PREPARATION`, chama `DeductForOrderUseCase` para deduzir ingredientes do estoque |
| `GetBaristaQueueUseCase` | Retorna fila de pedidos pendentes para o barista |
| `GetMyOrdersUseCase` | Retorna pedidos do cliente autenticado |

**Entidades:** `Order`, `OrderItem`
**Repositórios:** `IOrderRepository`
**Controller:** `OrdersController`

> O `OrdersModule` importa `MenuModule` para acessar `IProductRepository` e `InventoryModule` para acessar `IIngredientRepository` e `IInventoryMovementRepository` na criação de pedidos.

---

## InventoryModule

**Arquivo:** `src/inventory.module.ts`

Controla o estoque de ingredientes e registra todas as movimentações.

**Use Cases:**

| Use Case | Descrição |
|---|---|
| `CreateIngredientUseCase` | Cadastra um novo ingrediente |
| `ListIngredientsUseCase` | Lista todos os ingredientes |
| `GetIngredientUseCase` | Busca ingrediente por ID |
| `UpdateIngredientUseCase` | Atualiza dados de um ingrediente |
| `RestockIngredientUseCase` | Adiciona estoque a um ingrediente (gera movimentação `RESTOCK`) |
| `DeductForOrderUseCase` | Deduz ingredientes do estoque para um pedido (gera `DEDUCTION`) |
| `ListMovementsUseCase` | Lista histórico de movimentações de estoque |
| `GetStockAlertsUseCase` | Retorna ingredientes com estoque abaixo do mínimo |

**Entidades:** `Ingredient`, `InventoryMovement`
**Repositórios:** `IIngredientRepository`, `IInventoryMovementRepository`
**Controller:** `InventoryController`

---

## DashboardModule

**Arquivo:** `src/dashboard.module.ts`

Agrega métricas e dados analíticos para o painel gerencial (ADMIN).

**Use Cases:**

| Use Case | Descrição |
|---|---|
| `GetSummaryUseCase` | Retorna totais de pedidos, receita e métricas do período |
| `GetTopProductsUseCase` | Lista produtos mais vendidos |
| `GetPeakHoursUseCase` | Distribuição de pedidos por hora do dia |

**Repositórios:** utiliza `IOrderRepository` (importado do `OrdersModule`)
**Controller:** `DashboardController`
