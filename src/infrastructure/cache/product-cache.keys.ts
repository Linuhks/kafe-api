import type { Cache } from 'cache-manager';

const PREFIX = 'products:list:';

export function buildProductListKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  return PREFIX + Buffer.from(JSON.stringify(sorted)).toString('base64');
}

export async function clearProductListCache(cacheManager: Cache): Promise<void> {
  const store = cacheManager.store as { keys?: (pattern: string) => Promise<string[]> };
  if (typeof store.keys === 'function') {
    const keys = await store.keys(`${PREFIX}*`);
    await Promise.all(keys.map((k) => cacheManager.del(k)));
  }
}
