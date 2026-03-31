import { useEffect, useRef } from 'react';

/**
 * Simple interval hook. Calls `callback` every `delay` ms when `active` is true.
 */
export function useInterval(callback: () => void, delay: number | null, active: boolean = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || !active) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay, active]);
}
