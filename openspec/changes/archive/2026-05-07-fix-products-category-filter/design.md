## Context

O `ValidationPipe` global está configurado com `whitelist: true` e `forbidNonWhitelisted: true`. Isso exige que toda propriedade aceita via `@Query()` tenha pelo menos um decorator do `class-validator`. A classe `ListProductsQuery` (definida inline no `ProductsController`) herda de `PaginationDto` e declara `categoryId?: string` sem nenhum decorator, causando rejeição imediata pelo pipe.

## Goals / Non-Goals

**Goals:**
- Permitir que `GET /api/v1/products?categoryId=<uuid>` funcione sem erro de validação
- Garantir que valores inválidos para `categoryId` (não-UUID) sejam rejeitados com 400

**Non-Goals:**
- Mover `ListProductsQuery` para arquivo de DTO separado (melhoria cosmética, fora do escopo)
- Alterar a lógica de filtro no repositório ou use case

## Decisions

**Adicionar `@IsOptional()` e `@IsUUID()` ao `categoryId`**

A única mudança necessária é decorar a propriedade para que o `ValidationPipe` a reconheça como whitelisted. `@IsUUID()` garante formato correto e `@IsOptional()` preserva o comportamento de parâmetro não-obrigatório.

Alternativa considerada: mover `ListProductsQuery` para `dtos/menu/list-products-query.dto.ts`. Seria bom para consistência com o restante do projeto, mas está fora do escopo mínimo desta correção.

## Risks / Trade-offs

- [Risco] `@IsUUID()` por padrão valida UUID v4 — `@IsUUID('all')` aceita qualquer versão → usar `@IsUUID('all')` para não restringir desnecessariamente o tipo de UUID do banco.
