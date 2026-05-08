# Arquitetura

O `kafe-api` segue **Clean Architecture** sobre NestJS. O código é organizado em quatro camadas com dependências unidirecionais: as camadas internas não conhecem as externas.

```
presentation  →  application  →  domain
infrastructure                →  domain
```

---

## Camadas

### Domain

`src/domain/`

O núcleo do sistema. Não depende de nenhum framework, biblioteca externa ou banco de dados.

Contém:
- **Entities**: classes que representam os conceitos do negócio (`Order`, `Product`, `Ingredient`, `User`, etc.) e encapsulam as regras de validação e transição de estado
- **Repository interfaces**: contratos (`IOrderRepository`, `IUserRepository`, etc.) que definem o que a aplicação precisa persistir — sem saber *como*
- **Domain errors**: erros tipados que representam violações de regra de negócio (`InvalidOrderTransitionError`, `InsufficientStockError`, etc.)

Regra: nenhum `import` de `@nestjs/*`, Drizzle, Better-Auth ou qualquer dependência externa nesta camada.

---

### Application

`src/application/use-cases/`

Orquestra os casos de uso do negócio. Cada use case é uma classe com um único método `execute()`.

- Recebe e retorna tipos de domínio (entities, primitivos)
- Depende apenas de interfaces de repositório do domínio
- Não conhece HTTP, banco de dados ou NestJS
- Um use case por arquivo, agrupados por módulo (`users/`, `menu/`, `orders/`, `inventory/`, `dashboard/`)

---

### Infrastructure

`src/infrastructure/`

Implementações concretas dos contratos definidos no domínio.

- **Drizzle repositories**: implementam `IXxxRepository` usando Drizzle ORM + PostgreSQL
- **Better-Auth**: autenticação e sessão (gerenciado separadamente em `auth-schema.ts`)
- **Schema**: definição das tabelas em `schema.ts`

---

### Presentation

`src/presentation/`

Camada HTTP. Integra com NestJS e expõe a API REST.

- **Controllers**: recebem requisições, chamam use cases, retornam respostas
- **DTOs**: validação e tipagem de entrada/saída com `class-validator` e `class-transformer`
- **Guards / Decorators**: controle de acesso por papel (`@Roles`, `AuthGuard`)

---

## Fluxo de uma requisição

```
HTTP Request
    ↓
Controller (presentation)
    → valida DTO
    → chama Use Case (application)
        → chama Repository Interface (domain)
            → Drizzle Repository (infrastructure) executa SQL
        ← retorna Entity
    ← retorna resultado
    → mapeia para resposta HTTP
HTTP Response
```

Exemplo concreto — `POST /api/v1/orders`:

1. `OrdersController.create()` recebe o body, valida com `CreateOrderDto`
2. Chama `CreateOrderUseCase.execute(dto)`
3. O use case busca produtos via `IProductRepository`, valida estoque e persiste via `IOrderRepository`
4. Após criação, `DeductForOrderUseCase` é chamado para deduzir ingredientes do estoque
5. O controller retorna o pedido criado com status 201

---

## Módulos NestJS

Cada módulo (`UsersModule`, `MenuModule`, `OrdersModule`, `InventoryModule`, `DashboardModule`) é responsável por:

1. Registrar o controller da feature
2. Vincular a interface de repositório (`IXxxRepository`) à sua implementação Drizzle
3. Instanciar os use cases via factory (sem usar o sistema de injeção padrão do NestJS para use cases — ver [Code Guide](./code-guide.md))
