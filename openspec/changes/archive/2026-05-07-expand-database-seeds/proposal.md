## Why

O seed atual popula apenas usuários, categorias, ingredientes e produtos, deixando as tabelas `product_ingredients`, `orders`, `order_items` e `inventory_movements` vazias — sem dados relacionais realistas não é possível desenvolver ou testar features que dependem dessas entidades.

## What Changes

- Adicionar vínculos entre produtos e ingredientes (`product_ingredients`) com quantidades realistas por receita
- Adicionar pedidos de exemplo em todos os status possíveis (`RECEIVED`, `IN_PREPARATION`, `READY`, `DELIVERED`, `CANCELLED`) associados a clientes e baristas reais do seed
- Adicionar itens de pedido (`order_items`) com snapshots de nome e preço para cada pedido
- Adicionar movimentações de estoque (`inventory_movements`) cobrindo os três tipos: `DEDUCTION` (consumo por pedido), `RESTOCK` (reabastecimento) e `ADJUSTMENT` (ajuste manual)
- Expandir a lista de produtos e ingredientes para tornar o dataset mais rico e representativo

## Capabilities

### New Capabilities

- `product-ingredient-seed`: Seed de vínculos produto↔ingrediente com quantidades de receita
- `orders-seed`: Seed de pedidos, itens de pedido e movimentações de estoque com dados realistas

### Modified Capabilities

<!-- Nenhum requisito de spec existente muda — apenas dados de seed -->

## Impact

- Apenas o arquivo `src/infrastructure/db/seed.ts` é modificado
- Nenhuma API, schema ou migração é alterada
- O seed continua idempotente (usa `onConflictDoNothing` e verificação prévia)
