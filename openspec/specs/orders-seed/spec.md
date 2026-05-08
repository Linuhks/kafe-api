## ADDED Requirements

### Requirement: Seed insere pedidos em todos os status possíveis
O seed SHALL inserir pedidos cobrindo todos os valores do enum `order_status`: `RECEIVED`, `IN_PREPARATION`, `READY`, `DELIVERED` e `CANCELLED`. Pedidos SHALL referenciar `clientId` e `baristaId` de usuários existentes no seed. A seção de pedidos SHALL ser pulada se já existir qualquer pedido no banco.

#### Scenario: Todos os status de pedido estão representados
- **WHEN** o seed é executado com a tabela `orders` vazia
- **THEN** existem pedidos com cada um dos cinco status: RECEIVED, IN_PREPARATION, READY, DELIVERED, CANCELLED

#### Scenario: Pedidos referenciam usuários válidos
- **WHEN** o seed é executado
- **THEN** todo pedido com `clientId` não-nulo referencia o usuário CLIENT do seed, e `baristaId` referencia o usuário BARISTA do seed

#### Scenario: Re-execução não duplica pedidos
- **WHEN** o seed é executado com pedidos já existentes no banco
- **THEN** nenhum pedido novo é inserido

### Requirement: Seed insere itens de pedido com snapshots de preço
O seed SHALL inserir `order_items` para cada pedido. Cada item SHALL conter `productName` e `unitPrice` copiados do produto no momento da inserção (snapshot), além de `quantity` e `subtotal` calculado.

#### Scenario: Itens têm snapshot de nome e preço do produto
- **WHEN** o seed é executado
- **THEN** cada `order_item` contém `productName` igual ao nome do produto e `unitPrice` igual ao preço do produto no momento da inserção

#### Scenario: Subtotal está correto
- **WHEN** o seed é executado
- **THEN** o campo `subtotal` de cada `order_item` é igual a `unitPrice * quantity`

### Requirement: Seed insere movimentações de estoque dos três tipos
O seed SHALL inserir registros em `inventory_movements` cobrindo os três tipos: `DEDUCTION` (associado a um pedido entregue), `RESTOCK` (sem pedido associado) e `ADJUSTMENT` (sem pedido associado). A seção SHALL ser pulada junto com os pedidos se já existirem registros.

#### Scenario: Movimentação de dedução vinculada a pedido entregue
- **WHEN** o seed é executado
- **THEN** existe ao menos uma movimentação do tipo DEDUCTION com `orderId` referenciando um pedido com status DELIVERED

#### Scenario: Movimentação de reabastecimento sem pedido
- **WHEN** o seed é executado
- **THEN** existe ao menos uma movimentação do tipo RESTOCK com `orderId` nulo

#### Scenario: Movimentação de ajuste sem pedido
- **WHEN** o seed é executado
- **THEN** existe ao menos uma movimentação do tipo ADJUSTMENT com `orderId` nulo
