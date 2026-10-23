"use client";

import { useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { useI18n } from "@/i18n/I18nProvider";
import { FORMAT_LOCALE } from "@/i18n/locales";
import { MAX_AGE_YEARS } from "@/lib/birthdate";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { controlClasses } from "./styles";

interface BirthDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  today: Date;
  invalid?: boolean;
  describedBy?: string;
  onOpenChange?: (open: boolean) => void;
}

/** Field-like trigger that opens a calendar with month and year menus, so a birth year is two clicks away. */
export function BirthDatePicker({ value, onChange, today, invalid, describedBy, onOpenChange }: BirthDatePickerProps) {
  const labelId = useId();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const formatter = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });

  const setOpenState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="font-heading text-sm font-medium text-text">
        {t.auth.fields.birthDate}
      </span>
      <Popover.Root open={open} onOpenChange={setOpenState}>
        <Popover.Trigger
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
          className={controlClasses(Boolean(invalid), "flex items-center gap-3 text-left")}
        >
          <HugeiconsIcon icon={Calendar03Icon} size={20} strokeWidth={2} aria-hidden className="shrink-0 text-text-muted" />
          <span className={cn("flex-1 truncate", !value && "text-text-muted")}>
            {value ? formatter.format(value) : t.auth.fields.pickDate}
          </span>
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
            className="popover-motion z-50 rounded-xl bg-surface-raised p-3 text-text shadow-raised"
          >
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={value}
              defaultMonth={value ?? new Date(today.getFullYear() - 30, today.getMonth())}
              startMonth={new Date(today.getFullYear() - MAX_AGE_YEARS, 0)}
              endMonth={today}
              disabled={{ after: today }}
              reverseYears
              onSelect={(date) => {
                onChange(date);
                if (date) setOpenState(false);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
