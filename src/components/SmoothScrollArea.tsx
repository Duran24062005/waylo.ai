"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/design/motion";
import { SMOOTH_AREA_ATTRIBUTE, SMOOTH_SCROLL } from "@/components/SmoothScroll";

interface SmoothScrollApi {
  /** Glides to the end of the area. `immediate` jumps there, for the first paint of a conversation. */
  scrollToEnd: (immediate?: boolean) => void;
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

/** Lets content inside a SmoothScrollArea scroll it, without fighting its smooth scroll. */
export function useSmoothScroll(): SmoothScrollApi | null {
  return useContext(SmoothScrollContext);
}

interface SmoothScrollAreaProps {
  /** Classes of the scrolling box. It needs an overflow, such as overflow-y-auto. */
  className?: string;
  /** Classes of the box that holds the content. */
  contentClassName?: string;
  children: ReactNode;
}

/** A scrollable box with the same inertial scroll as the home page. Off under reduced motion. */
export function SmoothScrollArea({ className, contentClassName, children }: SmoothScrollAreaProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const wrapperEl = wrapper.current;
    const contentEl = content.current;
    if (!wrapperEl || !contentEl || prefersReducedMotion()) return;

    const lenis = new Lenis({ ...SMOOTH_SCROLL, wrapper: wrapperEl, content: contentEl });
    lenisRef.current = lenis;

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToEnd = useCallback((immediate = false) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo("bottom", { immediate });
      return;
    }
    // Without Lenis (reduced motion) the browser's own scrolling is used.
    const el = wrapper.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  const api = useMemo(() => ({ scrollToEnd }), [scrollToEnd]);

  return (
    <SmoothScrollContext.Provider value={api}>
      <div ref={wrapper} {...{ [SMOOTH_AREA_ATTRIBUTE]: "" }} className={className}>
        <div ref={content} className={contentClassName}>
          {children}
        </div>
      </div>
    </SmoothScrollContext.Provider>
  );
}
