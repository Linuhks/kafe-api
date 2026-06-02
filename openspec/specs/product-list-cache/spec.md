## Requirements

### Requirement: Resposta da listagem de produtos é servida do cache no Redis
O sistema SHALL armazenar a resposta de `GET /api/v1/products` no Redis com TTL de 60 segundos. Na segunda requisição com os mesmos parâmetros, a resposta SHALL ser retornada do cache sem consultar o banco de dados. A chave SHALL ser derivada dos query params (`page`, `limit`, `categoryId`).

#### Scenario: Segunda requisição com mesmos parâmetros retorna resposta em cache
- **WHEN** `GET /api/v1/products?page=1&limit=10` é chamado duas vezes consecutivas
- **THEN** a segunda chamada retorna 200 com o mesmo payload sem executar query no banco

#### Scenario: Requisições com parâmetros diferentes usam chaves de cache distintas
- **WHEN** `GET /api/v1/products?page=1` e `GET /api/v1/products?page=2` são chamados
- **THEN** cada combinação de parâmetros SHALL ter sua própria entrada no cache

#### Scenario: Cache expira após o TTL configurado
- **WHEN** o TTL de 60 segundos expira para uma entrada de cache
- **THEN** a próxima requisição consulta o banco e recria o cache

### Requirement: Cache é invalidado ao criar um produto
O sistema SHALL deletar todas as entradas de cache com prefixo `products:list:` quando a operação `CreateProduct` for concluída com sucesso.

#### Scenario: Cache invalidado após criação de produto
- **WHEN** `POST /api/v1/products` cria um produto com sucesso
- **THEN** a próxima chamada a `GET /api/v1/products` consulta o banco e retorna a lista atualizada com o novo produto

### Requirement: Cache é invalidado ao atualizar um produto
O sistema SHALL deletar todas as entradas de cache com prefixo `products:list:` quando a operação `UpdateProduct` for concluída com sucesso.

#### Scenario: Cache invalidado após atualização de produto
- **WHEN** `PATCH /api/v1/products/:id` atualiza um produto com sucesso
- **THEN** a próxima chamada a `GET /api/v1/products` consulta o banco e retorna o produto com os dados atualizados

### Requirement: Cache é invalidado ao deletar um produto
O sistema SHALL deletar todas as entradas de cache com prefixo `products:list:` quando a operação `DeleteProduct` for concluída com sucesso.

#### Scenario: Cache invalidado após deleção de produto
- **WHEN** `DELETE /api/v1/products/:id` deleta um produto com sucesso
- **THEN** a próxima chamada a `GET /api/v1/products` consulta o banco e o produto deletado não aparece na resposta

### Requirement: Redis indisponível não interrompe a listagem de produtos
Se o Redis não estiver disponível, o sistema SHALL servir a resposta diretamente do banco sem retornar erro 5xx ao cliente.

#### Scenario: Listagem funciona sem Redis
- **WHEN** o Redis está inacessível e o cliente chama `GET /api/v1/products`
- **THEN** o sistema retorna 200 com os produtos do banco de dados
