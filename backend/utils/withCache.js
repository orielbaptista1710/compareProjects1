// backend/utils/withCache.js
import NodeCache from "node-cache";

// stdTTL: default seconds before a key expires (overridable per-call)
// checkperiod: how often expired keys are swept
// useClones:false avoids deep-cloning cached objects — safe since we treat cached values as read-only
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

/**
 * Generic cache-aside wrapper. Reusable for any async fetch you want cached.
 *   const data = await withCache("some-key", () => fetchExpensiveThing(), { ttl: 60 });
 */
export const withCache = async (key, fn, { ttl } = {}) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const result = await fn();
  cache.set(key, result, ttl ?? undefined);
  return result;
};

/** Clears every cached key that starts with a given prefix. */
export const invalidateCache = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
};

export const clearCache = () => cache.flushAll();