"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import * as Select from "@radix-ui/react-select";
import type { ChangeEvent } from "react";
import { DayPicker, type DayPickerProps, type DropdownProps } from "react-day-picker";
import { enUS, es, ptBR } from "react-day-picker/locale";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

const DAY_PICKER_LOCALE: Record<Locale, typeof es> = { es, en: enUS, pt: ptBR };

const navButton = cn(
  "lift lift-sm pointer-events-auto inline-flex size-9 items-center justify-center rounded-md bg-surface-raised text-text shadow-soft",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "aria-disabled:pointer-events-none aria-disabled:opacity-40",
);

/**
 * Month and year menus. The native <select> list is drawn by the operating system and can't be
 * styled, so this is a Radix listbox: same keyboard support and roles, in the Waylo look.
 */
function CalendarDropdown({ options = [], value, onChange, "aria-label": ariaLabel, disabled }: DropdownProps) {
  const current = options.find((option) => option.value === Number(value));
  return (
    <Select.Root
      value={value === undefined ? undefined : String(value)}
      disabled={disabled}
      onValueChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group inline-flex h-9 items-center gap-1.5 rounded-md bg-surface pl-3 pr-2 font-heading text-sm font-semibold capitalize text-text shadow-inset",
          "field-focus data-[state=open]:shadow-pressed",
        )}
      >
        <Select.Value>{current?.label}</Select.Value>
        <Select.Icon asChild>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            strokeWidth={2.5}
            aria-hidden
            className="text-text-muted transition-transform duration-[var(--duration-base)] ease-standard group-data-[state=open]:rotate-180"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="popover-motion z-[60] max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg bg-surface-raised p-1 text-text shadow-raised"
        >
          <Select.ScrollUpButton className="flex h-6 items-center justify-center text-text-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} className="rotate-180" aria-hidden />
          </Select.ScrollUpButton>
          <Select.Viewport className="max-h-56">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                className={cn(
                  "relative flex h-9 cursor-pointer select-none items-center rounded-md pl-3 pr-8 font-heading text-sm capitalize text-text outline-none",
                  "transition-[background-color,transform] duration-[var(--duration-fast)] ease-standard",
                  "data-[highlighted]:bg-surface data-[highlighted]:translate-x-0.5",
                  "data-[state=checked]:font-semibold data-[disabled]:pointer-events-none data-[disabled]:opacity-35",
                )}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2 inline-flex">
                  <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.75} aria-hidden />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-6 items-center justify-center text-text-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} aria-hidden />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/** shadcn-style calendar on react-day-picker, in the Waylo palette and the app's language. */
export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  const { locale } = useI18n();
  return (
    <DayPicker
      locale={DAY_PICKER_LOCALE[locale]}
      showOutsideDays
      className={cn("select-none p-1", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex w-full flex-col gap-4",
        // The nav row spans the caption; only its buttons take clicks, so the month and year menus stay reachable.
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_caption: "flex h-9 items-center justify-center px-11",
        caption_label: "inline-flex h-9 items-center gap-1 rounded-md pl-3 pr-2 font-heading text-sm font-semibold capitalize text-text",
        dropdowns: "flex items-center justify-center gap-2",
        dropdown_root:
          "relative rounded-md bg-surface shadow-inset transition-shadow duration-[var(--duration-base)] ease-standard has-focus-visible:shadow-[inset_0_2px_5px_var(--shadow-deep),0_0_0_2px_color-mix(in_srgb,var(--focus-ring)_55%,transparent)]",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 pb-1 text-center font-heading text-xs font-medium uppercase text-text-muted",
        week: "mt-1 flex w-full",
        day: "group/day relative size-10 p-0 text-center",
        day_button: cn(
          "inline-flex size-10 items-center justify-center rounded-md font-heading text-sm text-text",
          "transition-[transform,background-color] duration-[var(--duration-fast)] ease-standard",
          "hover:bg-surface active:scale-95",
          "focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
        ),
        selected: "[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-accent-foreground [&>button]:shadow-solid [&>button]:hover:bg-accent",
        today: "[&>button]:font-bold [&>button]:underline [&>button]:underline-offset-4",
        outside: "[&>button]:text-text-muted [&>button]:opacity-50",
        disabled: "[&>button]:pointer-events-none [&>button]:opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Chevron: ({ orientation, className: chevronClass }) => (
          <HugeiconsIcon
            icon={orientation === "left" ? ArrowLeft01Icon : orientation === "right" ? ArrowRight01Icon : ArrowDown01Icon}
            size={orientation === "down" ? 14 : 18}
            strokeWidth={2.25}
            className={chevronClass}
            aria-hidden
          />
        ),
      }}
      {...props}
    />
  );
}
