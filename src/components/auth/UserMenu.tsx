"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { useT } from "@/i18n/I18nProvider";
import { formatWait } from "@/lib/wait";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Both buttons rise and cast a shadow on hover (the shared `lift`), and show the hand cursor.
const pill =
  "lift lift-sm inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full bg-text px-4 text-sm font-semibold text-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface UserMenuProps {
  /** What the person likes to be called, when signed in. */
  nombre?: string | null;
  /** Free replies a visitor has left. Not used for signed-in users. */
  guestLeft?: number;
  /** Milliseconds until a visitor who used up the free replies gets them back. */
  guestWaitMs?: number | null;
  className?: string;
}

/** The profile card: one frame, with sign-out inside it for signed-in users. */
export function UserMenu({ nombre, guestLeft, guestWaitMs, className }: UserMenuProps) {
  const t = useT();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setLeaving(false);
      router.refresh();
    }
  }

  const status =
    nombre || guestLeft === undefined
      ? t.profile.free
      : guestLeft <= 0 && guestWaitMs != null
        ? t.profile.comeBackIn(formatWait(guestWaitMs, t.common))
        : t.profile.freeReplies(guestLeft);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-text font-heading text-sm font-semibold text-surface"
        >
          {nombre ? initials(nombre) : <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold text-text">{nombre || t.profile.guestName}</p>
          {/* Not truncated: the free-replies count is the one thing a visitor must be able to read. */}
          <p className="text-sm leading-snug text-text-muted">{status}</p>
        </div>
        {nombre ? (
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            aria-label={t.profile.signOut}
            title={t.profile.signOut}
            className="group lift lift-sm grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-text text-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* The door's arrow slips out a little on hover. */}
            <HugeiconsIcon
              icon={Logout01Icon}
              size={20}
              strokeWidth={2.25}
              aria-hidden
              className="transition-transform duration-[var(--duration-base)] ease-standard group-hover:translate-x-0.5"
            />
          </button>
        ) : (
          <Link href="/login" className={pill}>
            {t.profile.signIn}
          </Link>
        )}
      </div>
    </div>
  );
}
