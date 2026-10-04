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
O projeto SHALL conter o arquivo `docs/business-rules.md` como índice das specs OpenSpec que definem as regras de negócio por domínio, sem repetir as regras.

#### Scenario: Regras de pedidos documentadas
- **WHEN** um desenvolvedor lê `docs/business-rules.md`
- **THEN** deve encontrar links para as specs que definem o ciclo de vida do pedido e as regras de transição de status

#### Scenario: Regras de inventário documentadas
- **WHEN** um desenvolvedor lê `docs/business-rules.md`
- **THEN** deve encontrar links para as specs de estoque (dedução/devolução, alertas, tipos de movimentação)

#### Scenario: Papéis de usuário documentados
- **WHEN** um desenvolvedor lê `docs/business-rules.md`
- **THEN** deve encontrar o link para a spec que define os três papéis (ADMIN, BARISTA, CLIENT)

---

### Requirement: Índice de módulos
O projeto SHALL conter o arquivo `docs/modules.md` com a responsabilidade e as dependências entre os módulos, sem repetir listas que a árvore de arquivos já mostra (use cases, entidades, repositórios).

#### Scenario: Todos os módulos listados
- **WHEN** um desenvolvedor abre `docs/modules.md`
- **THEN** deve encontrar os módulos auth, users, menu, orders, inventory e dashboard, cada um com responsabilidade e imports de outros módulos

#### Scenario: Use cases não são duplicados
- **WHEN** um desenvolvedor procura os use cases de um módulo
- **THEN** `docs/modules.md` o aponta para `src/application/use-cases/<módulo>/`

---

### Requirement: Referência de API gerada
A referência de endpoints SHALL vir do Swagger gerado pelos decorators dos controllers; `docs/API.md` SHALL conter apenas convenções transversais (autenticação, rate limit, paginação, formato de erro) e apontar para `/api/v1/docs`.

#### Scenario: Endpoint novo
- **WHEN** um endpoint é adicionado ou alterado
- **THEN** a documentação é atualizada pelos decorators do controller, sem editar `docs/API.md`
