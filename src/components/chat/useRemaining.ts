"use client";

import { useEffect, useState } from "react";

const TICK_MS = 15_000;

/**
 * Milliseconds left until `until` (epoch ms), counting down on screen. `null` while there is nothing to wait for,
 * and before the first tick in the browser, so the server and the first render agree.
 */
export function useRemaining(until?: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [until]);

  if (!until || now === null) return null;
  return Math.max(0, until - now);
}
