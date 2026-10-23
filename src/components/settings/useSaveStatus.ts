"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVED_MS = 1800;

/** Tracks "saving… / saved / could not save" for the changes of a section. */
export function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Runs a save. Resolves true when it worked. */
  const track = useCallback(async (save: () => Promise<boolean>): Promise<boolean> => {
    window.clearTimeout(timer.current);
    setStatus("saving");
    let ok = false;
    try {
      ok = await save();
    } catch {
      ok = false;
    }
    setStatus(ok ? "saved" : "error");
    if (ok) timer.current = window.setTimeout(() => setStatus("idle"), SAVED_MS);
    return ok;
  }, []);

  return { status, track };
}
