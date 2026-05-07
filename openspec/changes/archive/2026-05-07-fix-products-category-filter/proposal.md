## Why

O endpoint `GET /api/v1/products` rejeita o query param `categoryId` com erro `VALIDATION_ERROR` ("property categoryId should not exist") porque o `ValidationPipe` está configurado com `forbidNonWhitelisted: true` e a propriedade `categoryId` na classe `ListProductsQuery` não possui decorators do `class-validator`, portanto não é reconhecida como whitelisted.

## What Changes

- Adicionar decorators `@IsOptional()` e `@IsUUID()` à propriedade `categoryId` em `ListProductsQuery` no `ProductsController`

## Capabilities

### New Capabilities

- `products-list-filter`: Define os requisitos de validação do filtro por `categoryId` no endpoint `GET /api/v1/products`, garantindo que o parâmetro seja aceito como UUID opcional válido.

### Modified Capabilities

- Nenhuma

## Impact

- `src/presentation/controllers/products.controller.ts`: adição de decorators à propriedade `categoryId`
- Nenhuma breaking change — comportamento existente do endpoint é preservado, o filtro por categoria simplesmente passa a funcionar
