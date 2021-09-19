import { useMemo } from 'react';

export default function useCache() {
  return useMemo(() => {
    const cache = {};

    return {
      get: (cacheKey) => cache[cacheKey],
      set: (cacheKey, cacheValue) => {
        cache[cacheKey] = cacheValue;
      },
    };
  }, []);
}
