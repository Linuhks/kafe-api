## Context

O projeto `kafe-api` é uma API NestJS com arquitetura limpa. Atualmente a documentação técnica existe apenas nos arquivos `CLAUDE.md`, que foram escritos para orientar um assistente de IA (Claude Code) — não são adequados para onboarding de desenvolvedores humanos. Não há uma pasta `docs/` centralizada com descrições da arquitetura, regras de negócio, ou guia de contribuição.

## Goals / Non-Goals

**Goals:**
- Criar a pasta `docs/` na raiz do projeto
- Documentar a arquitetura em camadas do projeto (domain → application → infrastructure → presentation)
- Escrever um code guide com convenções, padrões de DI, estrutura de módulos e fluxo de contribuição
- Documentar as regras de negócio de cada domínio (users, menu, orders, inventory, dashboard)
- Indexar os módulos existentes com suas responsabilidades e use cases principais

**Non-Goals:**
- Não substituir nem alterar os arquivos `CLAUDE.md` existentes (eles servem a um propósito diferente)
- Não gerar documentação de API (o Swagger já cobre isso em `/api/v1/docs`)
- Não criar diagramas interativos ou ferramentas externas

## Decisions

**Estrutura de arquivos em `docs/`**

```
docs/
├── architecture.md      # Visão das camadas e fluxo de dados
├── code-guide.md        # Convenções, padrões, como contribuir
├── business-rules.md    # Regras de negócio por domínio
└── modules.md           # Índice dos módulos com use cases
```

Alternativa considerada: um arquivo único `docs/README.md`. Rejeitado porque misturaria audiências (arquitetos lendo sobre camadas vs. desenvolvedores buscando regras de negócio). Arquivos separados permitem leitura focada.

**Formato Markdown puro**

Sem ferramentas de geração (Docusaurus, Vitepress, etc.). A documentação precisa ser legível diretamente no GitHub/GitLab sem setup adicional. Markdown simples é suficiente e zero-overhead.

**Nível de detalhe**

Docs orientados a "o que precisa saber para contribuir" — não um paper acadêmico. Cada seção tem no máximo o necessário para um dev entender e trabalhar no módulo sem precisar abrir o código.

## Risks / Trade-offs

- **Docs ficam desatualizados** → Mitigação: estrutura simples facilita manutenção; adicionar revisão de docs no checklist de PRs que alteram comportamento de domínio
- **Duplicação com CLAUDE.md** → Aceitável — os públicos são distintos (humano vs. IA). Apenas conceitos de alto nível se sobrepõem

## Migration Plan

1. Criar pasta `docs/` na raiz
2. Criar os 4 arquivos em qualquer ordem (sem dependência entre eles)
3. Verificar que os links internos entre arquivos funcionam (ex.: `architecture.md` pode referenciar `modules.md`)

Sem rollback necessário — é adição pura de arquivos de texto.
