## ADDED Requirements

### Requirement: Filtro por categoria aceito como parâmetro opcional
O endpoint `GET /api/v1/products` SHALL aceitar o query param `categoryId` como UUID opcional. Quando presente, SHALL retornar apenas os produtos da categoria informada. Quando ausente, SHALL retornar todos os produtos sem filtragem por categoria.

#### Scenario: Requisição com categoryId UUID válido
- **WHEN** o cliente envia `GET /api/v1/products?categoryId=<uuid-válido>`
- **THEN** o sistema retorna 200 com os produtos filtrados pela categoria

#### Scenario: Requisição sem categoryId
- **WHEN** o cliente envia `GET /api/v1/products` sem o parâmetro `categoryId`
- **THEN** o sistema retorna 200 com todos os produtos sem filtro de categoria

#### Scenario: Requisição com categoryId em formato inválido
- **WHEN** o cliente envia `GET /api/v1/products?categoryId=nao-e-um-uuid`
- **THEN** o sistema retorna 400 com erro de validação indicando formato inválido
