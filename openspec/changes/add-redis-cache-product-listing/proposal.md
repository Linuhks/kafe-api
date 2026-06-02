## Why

`GET /api/v1/products` is a read-heavy endpoint called on every menu view, but product data changes rarely. Adding a Redis cache layer reduces database load and improves response times without changing the contract.

## What Changes

- Add `@nestjs/cache-manager`, `@keyv/redis`, and `keyv` packages
- Register `CacheModule.registerAsync` globally with a `KeyvRedis` store
- Cache the `ListProductsUseCase` response keyed by `products:list:<query-params>`
- Invalidate the cache (delete all `products:list:*` keys) on `CreateProduct`, `UpdateProduct`, and `DeleteProduct` operations
- Add `REDIS_URL` to `.env.example`

## Capabilities

### New Capabilities

- `product-list-cache`: Redis-backed cache for the product listing endpoint, with automatic invalidation on any product write operation.

### Modified Capabilities

<!-- None — external behavior of GET /api/v1/products is unchanged; only internal delivery mechanism changes. -->

## Impact

- **Dependencies**: `@nestjs/cache-manager`, `@keyv/redis`, `keyv`, `cacheable`
- **Modules**: `MenuModule` — injects `CacheManager`, calls `del` on write use cases
- **Infrastructure**: requires a running Redis instance; `docker-compose.yml` updated with a `redis` service
- **Config**: `REDIS_URL` env var added
- **Tests**: unit tests for use cases are unaffected (no cache at domain layer); integration/e2e tests may need a Redis container or mock
