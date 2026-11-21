// backend/utils/withCache.js
import NodeCache from "node-cache";
import logger from "./logger.js";

// All in-process caching goes through this file, so a later move to Redis
// touches only here.
//
// stdTTL: default seconds before a key expires (overridable per-call)
// checkperiod: how often expired keys are swept
// useClones:false avoids deep-cloning cached objects — safe since we treat cached values as read-only
// maxKeys: hard cap so a flood of unique keys can't grow memory without limit.
export const CACHE_MAX_KEYS = 5000;

const allCaches = [];

const makeStore = (maxKeys) => {
  const store = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false, maxKeys });
  allCaches.push(store);
  return store;
};

// At most one "cache full" warning per minute per cache, so a flood doesn't flood the logs.
const FULL_WARN_INTERVAL_MS = 60_000;

const makeWithCache = (store, name) => {
  let lastFullWarn = 0;

  return async (key, fn, { ttl } = {}) => {
    const cached = store.get(key);
    if (cached !== undefined) return cached;

    const result = await fn();
    try {
      store.set(key, result, ttl ?? undefined);
    } catch (err) {
      if (err?.errorcode !== "ECACHEFULL") throw err;
      // Full: serve the fresh result uncached rather than failing the request.
      // Entries free up as their TTL expires.
      const now = Date.now();
      if (now - lastFullWarn > FULL_WARN_INTERVAL_MS) {
        lastFullWarn = now;
        logger.warn("Cache full, serving uncached", { cache: name });
      }
    }
    return result;
  };
};

/**
 * Shared cache-aside wrapper for read-heavy, slow-changing data.
 *   const data = await withCache("some-key", () => fetchExpensiveThing(), { ttl: 60 });
 */
export const withCache = makeWithCache(makeStore(CACHE_MAX_KEYS), "shared");

/**
 * Separate, capped cache for callers whose keys come from user input (e.g.
 * search text). Keeps a flood of unique keys from filling the shared cache and
 * evicting fixed hot keys (discover, admin counts).
 * Cleared by clearCache() / invalidateCache() like the shared one.
 */
export const createCache = ({ name, maxKeys }) => makeWithCache(makeStore(maxKeys), name);

/** Clears every cached key that starts with a given prefix, in every cache. */
export const invalidateCache = (prefix) => {
  for (const store of allCaches) {
    const keys = store.keys().filter((k) => k.startsWith(prefix));
    if (keys.length) store.del(keys);
  }
};

export const clearCache = () => allCaches.forEach((store) => store.flushAll());
