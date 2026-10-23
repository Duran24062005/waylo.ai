"use client";

import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useScrollEdge, useSmoothScroll } from "@/components/SmoothScrollArea";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";

/**
 * A round button over the bottom of the conversation that jumps to the latest message once a lot is below.
 * (The fade above the input is the `scroll-fade` class on the area itself.) Needs a positioned parent.
 */
export function ScrollEdge() {
  const t = useT();
  const edge = useScrollEdge();
  const scroll = useSmoothScroll();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      <AnimatePresence>
        {edge?.far && (
          <motion.button
            type="button"
            onClick={() => scroll?.scrollToEnd()}
            aria-label={t.chat.jumpToLatest}
            title={t.chat.jumpToLatest}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            transition={{ duration: duration.base, ease: easing.standard }}
            className="lift lift-sm pointer-events-auto grid size-10 cursor-pointer place-items-center rounded-full bg-surface-raised text-text shadow-raised focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={2.25} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
