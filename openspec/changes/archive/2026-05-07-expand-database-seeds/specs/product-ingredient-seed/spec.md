## ADDED Requirements

### Requirement: Seed vincula produtos a ingredientes com quantidades de receita
O seed SHALL inserir registros na tabela `product_ingredients` associando cada produto aos seus ingredientes com quantidades realistas. Cada produto de café SHALL ter ao menos dois ingredientes. A inserção SHALL ser idempotente via `onConflictDoNothing`.

#### Scenario: Produtos de café têm ingredientes vinculados
- **WHEN** o seed é executado com a tabela `product_ingredients` vazia
- **THEN** cada produto da categoria "Cafés" possui ao menos um registro em `product_ingredients`

#### Scenario: Re-execução não duplica vínculos
- **WHEN** o seed é executado mais de uma vez
- **THEN** a tabela `product_ingredients` não contém registros duplicados para o mesmo par (productId, ingredientId)

#### Scenario: Produtos de outras categorias também recebem ingredientes
- **WHEN** o seed é executado
- **THEN** produtos das categorias "Doces" e "Salgados" também possuem ao menos um vínculo com ingrediente
