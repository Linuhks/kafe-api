# Regras de Negócio

---

## Usuários e Papéis

O sistema possui três papéis (`user_role`):

| Papel | Descrição |
|---|---|
| `ADMIN` | Acesso total: gerencia usuários, cardápio, ingredientes e visualiza dashboard |
| `BARISTA` | Opera pedidos: visualiza a fila, atualiza status e consulta estoque |
| `CLIENT` | Faz pedidos e consulta seus próprios pedidos |

Um usuário pode estar ativo (`isActive: true`) ou inativo. Usuários inativos não devem conseguir autenticar.

---

## Pedidos

### Ciclo de vida

Todo pedido nasce com status `RECEIVED` e progride através de transições válidas:

```
RECEIVED → IN_PREPARATION → READY → DELIVERED
    ↓              ↓
CANCELLED      CANCELLED
```

Transições válidas por status:

| Status atual | Pode ir para |
|---|---|
| `RECEIVED` | `IN_PREPARATION`, `CANCELLED` |
| `IN_PREPARATION` | `READY`, `CANCELLED` |
| `READY` | `DELIVERED` |
| `DELIVERED` | — (estado final) |
| `CANCELLED` | — (estado final) |

Tentar uma transição inválida lança `InvalidOrderTransitionError`.

### Criação de pedido

- Um pedido precisa ter ao menos um item (`OrderItem`)
- Cada item referencia um `Product` e uma quantidade
- O `totalAmount` é calculado com base nos preços dos produtos × quantidades
- A criação do pedido **não deduz estoque** — apenas valida que os produtos existem e estão disponíveis

### Dedução de estoque

A dedução dos ingredientes ocorre quando o barista avança o pedido para `IN_PREPARATION`:

- O sistema calcula a quantidade necessária de cada ingrediente com base na receita de cada produto do pedido
- Se qualquer ingrediente estiver com estoque insuficiente, a transição falha com `InsufficientStockError` e nenhuma dedução é realizada
- Caso o estoque seja suficiente, todos os ingredientes são deduzidos e um registro `DEDUCTION` é criado em `inventory_movements`

> **Observação:** o estoque não é reservado no momento da criação do pedido. Dois pedidos simultâneos para o mesmo produto podem ambos ser aceitos mesmo que haja ingredientes suficientes para apenas um.

### Fila do barista

O endpoint de fila retorna pedidos nos status `RECEIVED` e `IN_PREPARATION`, ordenados por data de criação (mais antigos primeiro).

---

## Cardápio

### Categorias

- Cada categoria tem um `sortOrder` para controlar a ordem de exibição
- Uma categoria pode ser ativada/desativada (`isActive`)
- Não é possível excluir uma categoria que tenha produtos vinculados

### Produtos

- Todo produto pertence a uma categoria
- Um produto pode estar disponível (`isAvailable: true`) ou indisponível
- `ToggleAvailability` inverte o estado de disponibilidade de um produto
- Um produto pode ter zero ou mais ingredientes na sua receita (`product_ingredients`)
- Cada vínculo produto-ingrediente define a `quantity` de ingrediente necessária por unidade do produto

### Ingredientes no cardápio

- Ingredientes são gerenciados no módulo de inventário, mas são referenciados pelo cardápio via `product_ingredients`
- Adicionar um ingrediente a um produto requer que tanto o produto quanto o ingrediente existam

---

## Inventário

### Estoque de ingredientes

- Cada ingrediente tem `currentStock` (estoque atual) e `minimumStock` (estoque mínimo)
- Unidades de medida são livres (`unit`: ex. `g`, `ml`, `un`)
- Um ingrediente está em alerta quando `currentStock ≤ minimumStock`

### Movimentações

Todo ajuste de estoque gera um registro em `inventory_movements` com tipo (`movement_type`):

| Tipo | Quando ocorre |
|---|---|
| `DEDUCTION` | Dedução automática ao criar um pedido |
| `RESTOCK` | Reabastecimento manual de um ingrediente |
| `ADJUSTMENT` | Correção manual de estoque (inventário físico) |

### Alertas de estoque

`GetStockAlertsUseCase` retorna todos os ingredientes onde `currentStock ≤ minimumStock`. Usado para alertas operacionais no painel do ADMIN/BARISTA.

---

## Dashboard

O módulo de dashboard agrega dados para visão gerencial (acesso restrito a ADMIN):

- **Resumo** (`GetSummaryUseCase`): totais de pedidos, receita e métricas gerais
- **Top produtos** (`GetTopProductsUseCase`): produtos mais vendidos por período
- **Horários de pico** (`GetPeakHoursUseCase`): distribuição de pedidos por hora do dia
