## 1. Setup

- [x] 1.1 Criar a pasta `docs/` na raiz do projeto

## 2. Arquitetura

- [x] 2.1 Criar `docs/architecture.md` descrevendo as quatro camadas (domain, application, infrastructure, presentation) e suas responsabilidades
- [x] 2.2 Documentar as regras de dependência entre camadas (domain sem deps externas, application depende de domain, etc.)
- [x] 2.3 Descrever o fluxo de uma requisição HTTP através das camadas até o banco e de volta

## 3. Code Guide

- [x] 3.1 Criar `docs/code-guide.md` com o padrão de injeção de dependência via `useFactory + inject`
- [x] 3.2 Documentar convenções de nomenclatura (entidades, use cases, repositórios, DTOs)
- [x] 3.3 Listar comandos de desenvolvimento com descrição de propósito (`start:dev`, `test`, `lint`, `format`, `seed`, `db:studio`)
- [x] 3.4 Descrever o fluxo de contribuição: onde criar cada tipo de arquivo e em qual camada

## 4. Regras de Negócio

- [x] 4.1 Criar `docs/business-rules.md` com os papéis de usuário (ADMIN, BARISTA, CLIENT) e permissões de cada um
- [x] 4.2 Documentar o ciclo de vida de um pedido e as transições de status válidas
- [x] 4.3 Documentar as regras de inventário: dedução automática ao criar pedido, alertas de estoque, tipos de movimentação
- [x] 4.4 Documentar regras do cardápio: categorias, produtos, disponibilidade, relação produto-ingrediente

## 5. Índice de Módulos

- [x] 5.1 Criar `docs/modules.md` com seção para cada módulo (users, menu, orders, inventory, dashboard)
- [x] 5.2 Para cada módulo: descrever responsabilidade principal, listar use cases e referenciar entidades/repositórios relacionados
