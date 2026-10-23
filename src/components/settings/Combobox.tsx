"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { controlClasses, focusRing } from "@/components/auth/styles";
import { normalizeText } from "@/lib/red-flags";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label: string;
  hint?: string;
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
  clearLabel: string;
  options: readonly ComboOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

/** A field with a long list behind it (cities, countries): open it, type to narrow the list, pick one. */
export function Combobox({
  label,
  hint,
  placeholder,
  searchPlaceholder,
  noResults,
  clearLabel,
  options,
  value,
  onChange,
  disabled,
}: ComboboxProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  // Accents and capitals do not matter when searching: "bogota" finds "Bogotá".
  const indexed = useMemo(() => options.map((option) => ({ option, key: normalizeText(option.label) })), [options]);
  const shown = useMemo(() => {
    const needle = normalizeText(query);
    return needle ? indexed.filter((item) => item.key.includes(needle)).map((item) => item.option) : [...options];
  }, [indexed, options, query]);

  const selected = options.find((option) => option.value === value);

  function change(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      const at = options.findIndex((option) => option.value === value);
      setActive(Math.max(0, at));
    }
  }

  function choose(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  function scrollToActive(index: number) {
    list.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (shown.length === 0) return;
      const next = (active + (event.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length;
      setActive(next);
      scrollToActive(next);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = shown[active];
      if (option) choose(option.value);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="font-heading text-sm font-medium text-text">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={change}>
        <Popover.Trigger
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-haspopup="listbox"
          className={controlClasses(false, "flex cursor-pointer items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60")}
        >
          <span className={cn("flex-1 truncate", !selected && "text-text-muted")}>{selected?.label ?? placeholder}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={18}
            strokeWidth={2.25}
            aria-hidden
            className={cn(
              "shrink-0 text-text-muted transition-transform duration-[var(--duration-base)] ease-standard",
              open && "rotate-180",
            )}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className="popover-motion z-50 w-[var(--radix-popover-trigger-width)] min-w-64 rounded-xl bg-surface-raised p-2 text-text shadow-raised"
          >
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                strokeWidth={2.25}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={`${id}-list`}
                role="combobox"
                aria-expanded
                aria-activedescendant={shown[active] ? `${id}-${active}` : undefined}
                className={controlClasses(false, "pl-10")}
              />
            </div>
            <ul
              ref={list}
              id={`${id}-list`}
              role="listbox"
              aria-label={label}
              className="scroll-soft -mr-1 mt-2 max-h-60 overflow-y-auto pr-1"
            >
              {shown.length === 0 ? (
                <li className="px-3 py-3 text-sm text-text-muted">{noResults}</li>
              ) : (
                shown.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${id}-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(option.value)}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      "transition-colors duration-[var(--duration-fast)] ease-standard",
                      index === active && "bg-surface",
                      option.value === value && "font-semibold",
                    )}
                  >
                    <span className="min-w-0 flex-1">{option.label}</span>
                    {option.value === value ? <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.75} aria-hidden /> : null}
                  </li>
                ))
              )}
            </ul>
            {value ? (
              <button
                type="button"
                onClick={() => choose(null)}
                className={cn(
                  "mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm text-text-muted hover:bg-surface hover:text-text",
                  focusRing,
                )}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.25} aria-hidden />
                {clearLabel}
              </button>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {hint ? <p className="text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}
