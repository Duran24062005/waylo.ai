"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UserIcon } from "@hugeicons/core-free-icons";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function freeRepliesLabel(left: number) {
  if (left <= 0) return "Sin respuestas gratis";
  return left === 1 ? "1 respuesta gratis" : `${left} respuestas gratis`;
}

const pill =
  "inline-flex h-9 shrink-0 items-center rounded-full bg-text px-4 text-sm font-semibold text-surface hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

interface UserMenuProps {
  nombre?: string | null;
  /** Free replies a visitor has left. Not used for signed-in users. */
  guestLeft?: number;
  className?: string;
}

/** The profile card: one frame, with sign-out inside it for signed-in users. */
export function UserMenu({ nombre, guestLeft, className }: UserMenuProps) {
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

  return (
    <div className={className}>
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-soft">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-pink-500 font-heading text-sm font-semibold text-white"
        >
          {nombre ? initials(nombre) : <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold text-text">
            {nombre ? nombre.split(" ")[0] : "Invitado"}
          </p>
          {/* Not truncated: the free-replies count is the one thing a visitor must be able to read. */}
          <p className="text-sm leading-snug text-text-muted">
            {nombre || guestLeft === undefined ? "Gratis" : freeRepliesLabel(guestLeft)}
          </p>
        </div>
        {nombre ? (
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-text text-surface hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={2.25} aria-hidden />
          </button>
        ) : (
          <Link href="/login" className={pill}>
            Entrar
          </Link>
        )}
      </div>
    </div>
  );
}
