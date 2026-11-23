// src/hooks/useDebouncedCallback.js
import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";

/**
 * Debounced version of `callback` with a stable identity.
 *
 * The timer is created once (per `wait`), so a re-render, or a new `callback`
 * closure, never cancels a call that is still waiting. When the timer fires it
 * runs the LATEST callback, so it sees current state instead of a stale closure.
 * Pending calls are cancelled on unmount; `.cancel()` is available to the caller.
 */
export function useDebouncedCallback(callback, wait) {
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  });

  const debounced = useMemo(
    // The ref is read only when the timer fires (after render), never during render.
    // eslint-disable-next-line react-hooks/refs
    () => debounce((...args) => latest.current(...args), wait),
    [wait]
  );

  useEffect(() => () => debounced.cancel(), [debounced]);

  return debounced;
}
