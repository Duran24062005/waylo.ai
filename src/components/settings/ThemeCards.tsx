"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import type { ThemePreference } from "@/components/theme";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

/** The page's own colors, written out: a preview has to show a theme that is not the one on screen. */
interface Palette {
  bg: string;
  raised: string;
  text: string;
  /** Faint shapes: the fake names in the sidebar, the placeholder of the input. */
  faint: string;
}

const LIGHT: Palette = { bg: "#f1f1f1", raised: "#ffffff", text: "#111111", faint: "#d4d4d4" };
const DARK: Palette = { bg: "#0b0b0b", raised: "#171717", text: "#f5f5f5", faint: "#333333" };

/** A bar that draws itself from the left when its card is chosen, one after another. */
function Line({ width, color, opacity = 1, order, active }: { width: string; color: string; opacity?: number; order: number; active: boolean }) {
  return (
    <motion.span
      // The key restarts it each time the card is chosen or let go, so the drawing is seen.
      key={active ? "on" : "off"}
      initial={active ? { scaleX: 0 } : false}
      animate={{ scaleX: 1 }}
      transition={{ duration: duration.base, ease: easing.standard, delay: order * 0.08 }}
      className="block h-[3px] rounded-full"
      style={{ width, backgroundColor: color, opacity, originX: 0 }}
    />
  );
}

/** A miniature of the chat in one theme: sidebar with the mascot, two lines of reply, a message, the input. */
function Mini({ palette, active }: { palette: Palette; active: boolean }) {
  return (
    <div className="absolute inset-0 flex" style={{ backgroundColor: palette.bg }}>
      <div className="flex w-[30%] flex-col items-center gap-1.5 px-1.5 py-2" style={{ backgroundColor: palette.raised }}>
        {/* The mascot: the sphere hops when the card is chosen. */}
        <motion.span
          key={active ? "on" : "off"}
          initial={false}
          animate={active ? { y: [0, -3, 0], scale: [1, 1.08, 1] } : { y: 0 }}
          transition={{ duration: duration.base, ease: easing.emphasis }}
          className="relative block aspect-square w-[34%] min-w-3.5 shrink-0 rounded-full"
          style={{ background: "radial-gradient(circle at 35% 30%, #ffffff, #cdcdcd)" }}
        >
          <span className="absolute left-[30%] top-[38%] h-[28%] w-[12%] rounded-full bg-[#0d0d0d]" />
          <span className="absolute right-[30%] top-[38%] h-[28%] w-[12%] rounded-full bg-[#0d0d0d]" />
        </motion.span>
        <span className="mt-0.5 block h-[3px] w-[70%] rounded-full" style={{ backgroundColor: palette.faint }} />
        <span className="block h-[3px] w-[55%] rounded-full" style={{ backgroundColor: palette.faint }} />
        <span className="block h-[3px] w-[62%] rounded-full" style={{ backgroundColor: palette.faint }} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between px-2 py-2">
        <div className="flex flex-col gap-1">
          <Line width="82%" color={palette.text} opacity={0.75} order={0} active={active} />
          <Line width="58%" color={palette.text} opacity={0.45} order={1} active={active} />
        </div>
        <motion.span
          key={active ? "on" : "off"}
          initial={active ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: duration.base, ease: easing.emphasis, delay: 0.2 }}
          className="block h-[7px] w-[44%] self-end rounded-full"
          style={{ backgroundColor: palette.text, originX: 1 }}
        />
        <span className="flex items-center gap-1 rounded-full px-1.5 py-[3px]" style={{ backgroundColor: palette.raised }}>
          <span className="block h-[3px] flex-1 rounded-full" style={{ backgroundColor: palette.faint }} />
          <span className="block size-2 rounded-full" style={{ backgroundColor: palette.text }} />
        </span>
      </div>
    </div>
  );
}

/** "System" shows both themes at once, split down the middle: it takes whichever the device has. */
function Preview({ mode, active }: { mode: ThemePreference; active: boolean }) {
  if (mode === "light") return <Mini palette={LIGHT} active={active} />;
  if (mode === "dark") return <Mini palette={DARK} active={active} />;
  return (
    <>
      <Mini palette={LIGHT} active={active} />
      <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
        <Mini palette={DARK} active={active} />
      </div>
    </>
  );
}

const ICONS: Record<ThemePreference, IconSvgElement> = { light: Sun01Icon, dark: Moon02Icon, system: ComputerIcon };

interface ThemeCardsProps {
  label: string;
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  options: readonly { value: ThemePreference; label: string }[];
}

/**
 * One card per theme, each with a miniature of the chat in that theme. No borders: the cards sit in a sunken tray, and
 * the chosen one is raised on a pill that slides from card to card. The arrow keys move the choice.
 */
export function ThemeCards({ label, value, onChange, options }: ThemeCardsProps) {
  const ringId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = options.findIndex((option) => option.value === value);
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1.5 shadow-inset">
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex cursor-pointer flex-col gap-2.5 rounded-xl p-1.5 pb-2.5",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            )}
          >
            {active ? (
              <motion.span
                layoutId={ringId}
                transition={{ duration: duration.base, ease: easing.standard }}
                className="pointer-events-none absolute inset-0 rounded-xl bg-surface-raised shadow-raised"
              />
            ) : null}

            <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg shadow-soft transition-transform duration-[var(--duration-base)] ease-standard group-hover:scale-[1.03]">
              <Preview mode={option.value} active={active} />
            </span>

            <span
              className={cn(
                "relative flex items-center justify-center gap-1.5 font-heading text-sm font-semibold transition-colors duration-[var(--duration-base)] ease-standard",
                active ? "text-text" : "text-text-muted group-hover:text-text",
              )}
            >
              <HugeiconsIcon icon={ICONS[option.value]} size={16} strokeWidth={2.25} aria-hidden />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
