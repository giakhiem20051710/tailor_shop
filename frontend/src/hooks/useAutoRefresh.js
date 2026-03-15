import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for auto-refreshing data at a given interval
 * @param {Function} callback - Function to call on each refresh
 * @param {number} intervalMs - Interval in milliseconds (default: 30000 = 30s)
 * @param {boolean} enabled - Whether auto-refresh is active (default: true)
 */
export default function useAutoRefresh(callback, intervalMs = 30000, enabled = true) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const refresh = useCallback(() => {
        savedCallback.current();
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const id = setInterval(() => {
            savedCallback.current();
        }, intervalMs);

        return () => clearInterval(id);
    }, [intervalMs, enabled]);

    return refresh;
}
