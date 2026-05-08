## 1. Ingredientes e Produtos

- [x] 1.1 Expandir a lista `INGREDIENTS` com ingredientes adicionais (ex: calda de baunilha, chantilly, queijo minas, presunto)
- [x] 1.2 Expandir `PRODUCTS_BY_CATEGORY` com mais produtos em cada categoria (ex: Americano, Cold Brew, Tiramisu, Coxinha)

## 2. Vínculos Produto↔Ingrediente

- [x] 2.1 Importar a tabela `productIngredients` do schema em `seed.ts`
- [x] 2.2 Definir o mapa `PRODUCT_INGREDIENTS` associando nome do produto aos ingredientes com quantidade
- [x] 2.3 Implementar a seção de inserção de `product_ingredients` com `onConflictDoNothing`, após resolver os IDs de produtos e ingredientes do banco

## 3. Pedidos e Itens

- [x] 3.1 Importar as tabelas `orders` e `orderItems` do schema em `seed.ts`
- [x] 3.2 Buscar os IDs do usuário CLIENT e BARISTA após a seção de usuários
- [x] 3.3 Definir `ORDERS_DATA` com pedidos em todos os cinco status (RECEIVED, IN_PREPARATION, READY, DELIVERED, CANCELLED), cada um com ao menos dois itens
- [x] 3.4 Implementar a seção de inserção de pedidos: verificar se já existem pedidos no banco; se não, inserir todos os pedidos e itens dentro de uma transação
- [x] 3.5 Calcular `totalAmount` de cada pedido como soma dos `subtotal` dos itens antes da inserção

## 4. Movimentações de Estoque

- [x] 4.1 Importar a tabela `inventoryMovements` do schema em `seed.ts`
- [x] 4.2 Definir movimentações do tipo `RESTOCK` e `ADJUSTMENT` (sem orderId)
- [x] 4.3 Implementar inserção de movimentações `DEDUCTION` referenciando o pedido com status `DELIVERED`
- [x] 4.4 Implementar inserção das movimentações `RESTOCK` e `ADJUSTMENT`

## 5. Validação

- [x] 5.1 Executar `pnpm run seed` em ambiente local e verificar que todas as tabelas foram populadas sem erros
- [x] 5.2 Executar `pnpm run seed` uma segunda vez e confirmar que nenhum dado foi duplicado (idempotência)
