"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  ArrowUp01Icon,
  Login01Icon,
  Logout01Icon,
  Settings01Icon,
  UserCircleIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useSettings } from "@/components/settings/SettingsProvider";
import type { SectionId } from "@/components/settings/sections";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { formatWait } from "@/lib/wait";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// The card, the menu rows and the focus ring all take the same slightly darker (lighter in the dark theme) tone on hover.
const TONE = "color-mix(in srgb, var(--text) 7%, var(--surface))";

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const menuRow = cn(
  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-heading text-sm font-medium text-text outline-none",
  "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface focus-visible:bg-surface",
);

function Avatar({ nombre }: { nombre?: string | null }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-text font-heading text-sm font-semibold text-surface"
    >
      {nombre ? initials(nombre) : <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} />}
    </span>
  );
}

interface UserMenuProps {
  /** What the person likes to be called, when signed in. */
  nombre?: string | null;
  /** Free replies a visitor has left. Not used for signed-in users. */
  guestLeft?: number;
  /** Milliseconds until a visitor who used up the free replies gets them back. */
  guestWaitMs?: number | null;
  className?: string;
}

/** The profile card. It is a button: it darkens on hover and opens a menu upward with the profile, usage and settings. */
export function UserMenu({ nombre, guestLeft, guestWaitMs, className }: UserMenuProps) {
  const t = useT();
  const router = useRouter();
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  // Choosing a row that opens the settings window must not hand the focus back to the card as the menu closes.
  const keepFocus = useRef(false);

  const status =
    nombre || guestLeft === undefined
      ? t.profile.free
      : guestLeft <= 0 && guestWaitMs != null
        ? t.profile.comeBackIn(formatWait(guestWaitMs, t.common))
        : t.profile.freeReplies(guestLeft);

  function openSettings(section: SectionId) {
    keepFocus.current = true;
    setOpen(false);
    settings.open(section);
  }

  async function signOut() {
    setOpen(false);
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  const rows: { section: SectionId; label: string; icon: IconSvgElement }[] = [
    { section: "account", label: t.profile.menu.profile, icon: UserCircleIcon },
    { section: "usage", label: t.profile.menu.usage, icon: Analytics01Icon },
    { section: "general", label: t.profile.menu.settings, icon: Settings01Icon },
  ];

  return (
    <div className={className}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={t.profile.menu.open}
            aria-haspopup="menu"
            data-settings-opener
            className={cn(
              "group flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-soft",
              "transition-colors duration-[var(--duration-base)] ease-standard",
              "hover:bg-[var(--tone)] data-[state=open]:bg-[var(--tone)]",
              focusRing,
            )}
            style={{ "--tone": TONE } as React.CSSProperties}
          >
            <Avatar nombre={nombre} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-base font-semibold text-text">
                {nombre || t.profile.guestName}
              </span>
              {/* Not truncated: the free-replies count is the one thing a visitor must be able to read. */}
              <span className="block text-sm leading-snug text-text-muted">{status}</span>
            </span>
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              size={18}
              strokeWidth={2.25}
              aria-hidden
              className="shrink-0 text-text-muted transition-transform duration-[var(--duration-base)] ease-standard group-data-[state=open]:rotate-180"
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            role="menu"
            side="top"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            onKeyDown={onKeyDown}
            onCloseAutoFocus={(event) => {
              if (keepFocus.current) event.preventDefault();
              keepFocus.current = false;
            }}
            className="popover-motion z-50 w-[var(--radix-popover-trigger-width)] min-w-64 rounded-2xl bg-surface-raised p-2 text-text shadow-raised"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar nombre={nombre} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-base font-semibold">{nombre || t.profile.guestName}</p>
                <p className="text-sm leading-snug text-text-muted">{status}</p>
              </div>
            </div>
            <div role="separator" className="mx-2 my-1.5 h-px bg-text/10" />

            {nombre ? (
              <>
                {rows.map((row) => (
                  <button key={row.section} type="button" role="menuitem" className={menuRow} onClick={() => openSettings(row.section)}>
                    <HugeiconsIcon icon={row.icon} size={20} strokeWidth={2} aria-hidden />
                    {row.label}
                  </button>
                ))}
                <div role="separator" className="mx-2 my-1.5 h-px bg-text/10" />
                <button type="button" role="menuitem" className={menuRow} onClick={() => void signOut()}>
                  <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={2} aria-hidden />
                  {t.profile.signOut}
                </button>
              </>
            ) : (
              <>
                <button type="button" role="menuitem" className={menuRow} onClick={() => openSettings("general")}>
                  <HugeiconsIcon icon={Settings01Icon} size={20} strokeWidth={2} aria-hidden />
                  {t.profile.menu.settings}
                </button>
                <div role="separator" className="mx-2 my-1.5 h-px bg-text/10" />
                <Link href="/login" role="menuitem" className={menuRow}>
                  <HugeiconsIcon icon={Login01Icon} size={20} strokeWidth={2} aria-hidden />
                  {t.profile.menu.signIn}
                </Link>
              </>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
