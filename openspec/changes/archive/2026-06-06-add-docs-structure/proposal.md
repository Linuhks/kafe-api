## Why

O projeto não possui documentação centralizada além dos `CLAUDE.md` voltados para o assistente de IA. Desenvolvedores humanos não têm um lugar claro para entender a arquitetura, as regras de negócio, os módulos existentes e o guia de contribuição — tudo isso disperso ou ausente.

## What Changes

- Criação da pasta `docs/` na raiz do projeto com documentação voltada para humanos
- Documento de arquitetura descrevendo as camadas (domain, application, infrastructure, presentation) e como elas se relacionam
- Code guide cobrindo convenções, padrões de DI, estrutura de módulos e fluxo de desenvolvimento
- Documentação das regras de negócio (pedidos, cardápio, inventário, usuários)
- Índice dos módulos existentes (users, menu, orders, inventory, dashboard) com responsabilidades e principais use cases

## Capabilities

### New Capabilities

- `project-documentation`: Criação e organização da pasta `docs/` com arquivos de referência técnica e de negócio para desenvolvedores humanos

### Modified Capabilities

<!-- Nenhuma spec existente de requisito muda — é adição de documentação pura -->

## Impact

- Nenhuma mudança em código de produção, APIs ou dependências
- Arquivos novos apenas em `docs/`
- Documentação passa a ser o ponto de entrada para novos contribuidores
