import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling – runs fetchFn immediately and then every intervalMs.
 * Cleans up on unmount. Pass a stable fetchFn (wrap in useCallback).
 * @param {() => Promise<void>} fetchFn
 * @param {number} intervalMs
 * @param {boolean} [enabled=true]
 */
export function usePolling(fetchFn, intervalMs, enabled = true) {
    const savedFn = useRef(fetchFn);
    useEffect(() => { savedFn.current = fetchFn; }, [fetchFn]);

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        const run = () => { if (active) savedFn.current(); };
        run();
        const id = setInterval(run, intervalMs);
        return () => { active = false; clearInterval(id); };
    }, [intervalMs, enabled]);
}
