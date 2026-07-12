//this hook is for debouncing search input-usedDebounceHook.js
//frontend-vite/src/hooks/useDebounceHook.js
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}