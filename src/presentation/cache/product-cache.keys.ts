import type { Cache } from '@nestjs/cache-manager';

const PREFIX = 'products:list:';
const activeKeys = new Set<string>();

export function buildProductListKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  const key = PREFIX + Buffer.from(JSON.stringify(sorted)).toString('base64');
  activeKeys.add(key);
  return key;
}

export async function clearProductListCache(cacheManager: Cache): Promise<void> {
  await Promise.all([...activeKeys].map((k) => cacheManager.del(k)));
  activeKeys.clear();
}
