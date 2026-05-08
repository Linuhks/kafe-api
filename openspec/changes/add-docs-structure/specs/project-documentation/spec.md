## ADDED Requirements

### Requirement: Pasta docs/ criada na raiz do projeto
O projeto SHALL conter uma pasta `docs/` na raiz com arquivos de documentação técnica e de negócio voltados para desenvolvedores humanos.

#### Scenario: Estrutura mínima presente
- **WHEN** um desenvolvedor clona o repositório
- **THEN** a pasta `docs/` deve existir com os arquivos `architecture.md`, `code-guide.md`, `business-rules.md` e `modules.md`

---

### Requirement: Documentação de arquitetura
O projeto SHALL conter o arquivo `docs/architecture.md` descrevendo as camadas do sistema e o fluxo de dados entre elas.

#### Scenario: Camadas documentadas
- **WHEN** um desenvolvedor abre `docs/architecture.md`
- **THEN** deve encontrar descrição das camadas domain, application, infrastructure e presentation, incluindo responsabilidades e regras de dependência entre elas

#### Scenario: Fluxo de uma requisição documentado
- **WHEN** um desenvolvedor lê o arquivo de arquitetura
- **THEN** deve conseguir entender como uma requisição HTTP percorre as camadas até o banco de dados e volta

---

### Requirement: Code guide
O projeto SHALL conter o arquivo `docs/code-guide.md` com guia de contribuição e convenções adotadas.

#### Scenario: Convenções de módulo documentadas
- **WHEN** um desenvolvedor lê o code guide
- **THEN** deve encontrar o padrão de injeção de dependência (useFactory + inject), estrutura de módulo NestJS e convenções de nomenclatura

#### Scenario: Comandos de desenvolvimento documentados
- **WHEN** um desenvolvedor lê o code guide
- **THEN** deve encontrar os comandos essenciais (start:dev, test, lint, format, seed, db:studio) com descrição do propósito de cada um

---

### Requirement: Documentação de regras de negócio
O projeto SHALL conter o arquivo `docs/business-rules.md` descrevendo as regras de negócio por domínio.

#### Scenario: Regras de pedidos documentadas
- **WHEN** um desenvolvedor lê `docs/business-rules.md`
- **THEN** deve encontrar o ciclo de vida de um pedido (RECEIVED → IN_PREPARATION → READY → DELIVERED/CANCELLED) e as regras de transição de status

#### Scenario: Regras de inventário documentadas
- **WHEN** um desenvolvedor lê as regras de negócio
- **THEN** deve encontrar como o inventário é deduzido ao criar pedidos, o que são alertas de estoque e os tipos de movimentação (DEDUCTION, RESTOCK, ADJUSTMENT)

#### Scenario: Papéis de usuário documentados
- **WHEN** um desenvolvedor lê as regras de negócio
- **THEN** deve encontrar os três papéis (ADMIN, BARISTA, CLIENT) e o que cada um pode fazer no sistema

---

### Requirement: Índice de módulos
O projeto SHALL conter o arquivo `docs/modules.md` indexando os módulos existentes com suas responsabilidades e use cases principais.

#### Scenario: Todos os módulos listados
- **WHEN** um desenvolvedor abre `docs/modules.md`
- **THEN** deve encontrar os módulos users, menu, orders, inventory e dashboard, cada um com: responsabilidade principal, lista de use cases e entidades/repositórios relacionados

#### Scenario: Use cases listados por módulo
- **WHEN** um desenvolvedor consulta o módulo de pedidos em `docs/modules.md`
- **THEN** deve encontrar os use cases: CreateOrder, GetOrder, ListOrders, UpdateOrderStatus, GetBaristaQueue, GetMyOrders
