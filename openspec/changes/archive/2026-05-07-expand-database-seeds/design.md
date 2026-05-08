## Context

O seed atual (`src/infrastructure/db/seed.ts`) cria usuários, categorias, ingredientes e produtos, mas deixa quatro tabelas completamente vazias: `product_ingredients`, `orders`, `order_items` e `inventory_movements`. Isso impede o desenvolvimento e teste de features que dependem de pedidos, consumo de estoque e receitas.

O seed já usa um padrão idempotente com `onConflictDoNothing` e verificação prévia via `select` antes de inserir usuários. A mesma abordagem deve ser mantida.

## Goals / Non-Goals

**Goals:**
- Seed de vínculos produto↔ingrediente com quantidades realistas de receita
- Seed de pedidos em todos os status (`RECEIVED`, `IN_PREPARATION`, `READY`, `DELIVERED`, `CANCELLED`) referenciando usuários já inseridos
- Seed de itens de pedido com snapshots de nome e preço consistentes com os produtos
- Seed de movimentações de estoque dos três tipos (`DEDUCTION`, `RESTOCK`, `ADJUSTMENT`)
- Manter idempotência: re-executar o seed não deve duplicar dados

**Non-Goals:**
- Alterar schema, migrations ou qualquer outra parte da infraestrutura
- Criar múltiplos arquivos de seed ou separar seeds por entidade
- Adicionar CLI flags ou seed seletivo por módulo

## Decisions

### Tudo em um único arquivo `seed.ts`

**Decisão**: manter tudo em `src/infrastructure/db/seed.ts`.  
**Rationale**: o projeto já tem um único ponto de entrada de seed e há um script `pnpm run seed` que o chama. Criar múltiplos arquivos exigiria orquestração e alteraria o workflow atual sem benefício real para o escopo deste change.  
**Alternativa descartada**: arquivos separados por entidade (`seed-orders.ts`, etc.) — overhead desnecessário.

### Idempotência por `onConflictDoNothing` + lookup pós-inserção

**Decisão**: usar `onConflictDoNothing()` para categorias/produtos/ingredientes; para entidades sem unique constraint natural (pedidos, movimentações), usar uma flag de controle — checar se já existem registros antes de inserir o bloco completo.  
**Rationale**: evita duplicação sem exigir `DELETE` ou `TRUNCATE` (que quebraria idempotência em ambientes compartilhados).

### IDs dos usuários resolvidos em runtime

**Decisão**: buscar os IDs dos usuários do banco após inserção (ou verificação de existência) e usá-los como FK nos pedidos.  
**Rationale**: os IDs são UUIDs gerados pelo banco, não conhecidos em tempo de escrita do seed.

## Risks / Trade-offs

- **Pedidos duplicados em re-execução** → Mitigação: verificar `count` de pedidos antes de inserir o bloco; se já existir qualquer pedido, pular a seção inteira de pedidos/movimentações
- **Quantidades de receita arbitrárias** → Trade-off aceitável: o seed visa representatividade para desenvolvimento, não precisão nutricional
- **Dependência de ordem de inserção** → Mitigação: manter a sequência: usuários → categorias → ingredientes → produtos → product_ingredients → pedidos → itens → movimentações
