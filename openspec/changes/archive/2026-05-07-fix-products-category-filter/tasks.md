## 1. Correção da validação

- [x] 1.1 Adicionar `@IsOptional()` e `@IsUUID('all')` à propriedade `categoryId` em `ListProductsQuery` no `ProductsController`
- [x] 1.2 Adicionar imports de `IsOptional` e `IsUUID` de `class-validator` no topo do controller

## 2. Verificação

- [x] 2.1 Testar `GET /api/v1/products?categoryId=<uuid-válido>` e confirmar retorno 200
- [x] 2.2 Testar `GET /api/v1/products` sem `categoryId` e confirmar retorno 200
- [x] 2.3 Testar `GET /api/v1/products?categoryId=invalido` e confirmar retorno 400
