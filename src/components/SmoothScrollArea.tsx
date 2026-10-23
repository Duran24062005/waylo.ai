"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

/** Whether content is hidden below the visible edge, and whether a lot of it is. */
interface ScrollEdge {
  /** Something is cut off at the bottom. */
  clipped: boolean;
  /** Well over a screenful of content is below, enough to be worth a way to jump down. */
  far: boolean;
}

// Kept apart from the scroll API so the API stays the same object and nothing re-runs when the edge changes.
const ScrollEdgeContext = createContext<ScrollEdge | null>(null);

/** Where the reader is in a SmoothScrollArea, for the fade and the jump-down button. */
export function useScrollEdge(): ScrollEdge | null {
  return useContext(ScrollEdgeContext);
}

/** Closer than this to the end counts as being at the end. */
const CLIPPED_PX = 4;
/** More than this much below the visible part, and the jump-down button shows. */
const FAR_PX = 240;

interface SmoothScrollAreaProps {
  /** Classes of the scrolling box. It needs an overflow, such as overflow-y-auto. */
  className?: string;
  /** Classes of the box that holds the content. */
  contentClassName?: string;
  /** Drawn next to the scrolling box (not inside it), and can read the scroll API and `useScrollEdge`. */
  overlay?: ReactNode;
  children: ReactNode;
}

/** A scrollable box with the same inertial scroll as the home page. Off under reduced motion. */
export function SmoothScrollArea({ className, contentClassName, overlay, children }: SmoothScrollAreaProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [edge, setEdge] = useState<ScrollEdge>({ clipped: false, far: false });

  // Scrolling, and content growing (a reply being typed, a new message), both change what is below the edge.
  useEffect(() => {
    const wrapperEl = wrapper.current;
    const contentEl = content.current;
    if (!wrapperEl || !contentEl) return;

    const measure = () => {
      const below = wrapperEl.scrollHeight - wrapperEl.scrollTop - wrapperEl.clientHeight;
      const clipped = below > CLIPPED_PX;
      const far = below > FAR_PX;
      setEdge((current) => (current.clipped === clipped && current.far === far ? current : { clipped, far }));
    };

    measure();
    wrapperEl.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(wrapperEl);
    observer.observe(contentEl);
    return () => {
      wrapperEl.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

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
      <ScrollEdgeContext.Provider value={edge}>
        <div
          ref={wrapper}
          {...{ [SMOOTH_AREA_ATTRIBUTE]: "" }}
          // Lets styles react to content hidden below, such as the scroll-fade utility.
          data-clipped={edge.clipped ? "" : undefined}
          className={className}
        >
          <div ref={content} className={contentClassName}>
            {children}
          </div>
        </div>
        {overlay}
      </ScrollEdgeContext.Provider>
    </SmoothScrollContext.Provider>
  );
}
