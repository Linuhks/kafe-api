## Context

`GET /api/v1/products` queries PostgreSQL via Drizzle on every request. Product data is updated infrequently (by ADMIN/BARISTA) but read constantly (every menu view). The project follows clean architecture — domain and use-case layers must stay framework-free.

NestJS v11 changed the CacheModule API: `redisStore` is gone; the supported approach is `KeyvRedis` from `@keyv/redis` as a store passed to `CacheModule.registerAsync`.

## Goals / Non-Goals

**Goals:**
- Cache the full response of `GET /api/v1/products` (including pagination and filters) in Redis
- Automatically invalidate the cache on create, update, and delete product operations
- Keep domain and use-case layers free of cache concerns

**Non-Goals:**
- Caching other endpoints (categories, orders, inventory)
- Per-user or role-based cache partitions
- Distributed cache invalidation across multiple API instances (out of scope for now)

## Decisions

### 1. Cache layer: Controller (not use case)

Inject `CACHE_MANAGER` into `ProductsController` and wrap the list use case call. Alternatives:
- **Use case layer**: would require injecting a framework token into application layer — violates clean architecture.
- **Interceptor**: `CacheInterceptor` from `@nestjs/cache-manager` doesn't support manual key construction with query params.
- **Controller** (chosen): keeps domain clean, gives full control over key construction and invalidation timing.

### 2. Cache key strategy: `products:list:<base64(queryParams)>`

Params (`page`, `limit`, `categoryId`) are serialised as a sorted JSON string, then base64-encoded to form a safe Redis key. Prefix `products:list:` enables pattern-based bulk deletion.

Alternative: fixed key `products:list` ignoring filters — simpler but returns wrong data for filtered requests.

### 3. Invalidation strategy: delete `products:list:*` on any write

On `CreateProduct`, `UpdateProduct`, and `DeleteProduct` success, the controller calls `cacheManager.del` on all known `products:list:*` keys via a helper that scans the store. This is safe and predictable.

Alternative: TTL-only expiry — simpler but allows stale data after writes.

### 4. Redis via `@keyv/redis` + `@nestjs/cache-manager`

This is the NestJS v11-recommended approach (see migration guide). `KeyvRedis` wraps ioredis internally.

```typescript
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: () => ({
    stores: [new KeyvRedis(process.env.REDIS_URL ?? 'redis://localhost:6379')],
    ttl: 60_000, // 60 s default TTL
  }),
})
```

### 5. Docker Compose: add `redis` service

Add a Redis container to `docker-compose.yml` so local dev mirrors production. Service name `redis`, image `redis:7-alpine`, port `6379:6379`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Redis unavailable at startup | `CacheModule` with Keyv fails gracefully — requests fall through to DB |
| Cache stampede on cold start | Low risk for this traffic volume; acceptable |
| Key enumeration for bulk delete | Use `cacheManager.store.keys('products:list:*')` if the store supports it; otherwise maintain a Set of active keys in memory (simpler fallback) |
| Stale data if Redis evicts before explicit delete | TTL of 60 s caps staleness; write-path invalidation handles normal cases |
