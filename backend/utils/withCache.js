// backend/utils/withCache.js
import NodeCache from "node-cache";

// stdTTL: default seconds before a key expires (overridable per-call)
// checkperiod: how often expired keys are swept
// useClones:false avoids deep-cloning cached objects — safe since we treat cached values as read-only
// maxKeys: hard cap so a flood of unique keys (e.g. random search text) can't grow memory without limit.
export const CACHE_MAX_KEYS = 5000;
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false, maxKeys: CACHE_MAX_KEYS });

/**
 * Generic cache-aside wrapper. Reusable for any async fetch you want cached.
 *   const data = await withCache("some-key", () => fetchExpensiveThing(), { ttl: 60 });
 */
export const withCache = async (key, fn, { ttl } = {}) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const result = await fn();
  try {
    cache.set(key, result, ttl ?? undefined);
  } catch {
    // Cache is full (NodeCache throws ECACHEFULL). Serve the fresh result uncached
    // rather than failing the request; entries free up as their TTL expires.
  }
  return result;
};

/** Clears every cached key that starts with a given prefix. */
export const invalidateCache = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
};

export const clearCache = () => cache.flushAll();