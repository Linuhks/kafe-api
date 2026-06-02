## 1. Setup e Dependências

- [x] 1.1 Instalar pacotes: `@nestjs/cache-manager`, `@keyv/redis`, `keyv`, `cacheable`
- [x] 1.2 Adicionar serviço `redis` (image `redis:7-alpine`, port `6379:6379`) ao `docker-compose.yml`
- [x] 1.3 Adicionar `REDIS_URL=redis://localhost:6379` ao `.env.example`
- [x] 1.4 Registrar `CacheModule.registerAsync` com `KeyvRedis` e `isGlobal: true` no `AppModule`

## 2. Utilitário de Cache

- [x] 2.1 Criar `src/infrastructure/cache/product-cache.keys.ts` com função `buildProductListKey(params)` que serializa os query params em base64 com prefixo `products:list:`
- [x] 2.2 Criar função `clearProductListCache(cacheManager)` no mesmo arquivo que deleta todas as chaves com prefixo `products:list:` via `cacheManager.store.keys` (ou fallback com Set em memória)

## 3. Integração no Controller

- [x] 3.1 Injetar `@Inject(CACHE_MANAGER) cacheManager: Cache` no controller de produtos
- [x] 3.2 No handler `GET /products`: antes de chamar o use case, tentar obter do cache; se miss, chamar o use case e armazenar o resultado com TTL de 60 s
- [x] 3.3 No handler `POST /products` (criar): após sucesso, chamar `clearProductListCache`
- [x] 3.4 No handler `PATCH /products/:id` (atualizar): após sucesso, chamar `clearProductListCache`
- [x] 3.5 No handler `DELETE /products/:id` (deletar): após sucesso, chamar `clearProductListCache`

## 4. Gate

- [x] 4.1 Executar `pnpm lint && pnpm check && pnpm test` e garantir que os três passam
