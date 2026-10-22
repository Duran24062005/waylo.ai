"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

const linkStyles =
  "inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-sm font-medium text-text-muted hover:text-text focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

export function UserMenu({ nombre, className }: { nombre?: string | null; className?: string }) {
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
    <div className={cn("flex flex-col gap-1", className)}>
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
          <p className="text-sm text-text-muted">Gratis</p>
        </div>
        {nombre ? (
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-text px-4 text-sm font-semibold text-surface hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Mejorar
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-text px-4 text-sm font-semibold text-surface hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Entrar
          </Link>
        )}
      </div>

      {nombre ? (
        <button type="button" onClick={logout} disabled={leaving} className={linkStyles}>
          <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2} aria-hidden />
          Cerrar sesión
        </button>
      ) : (
        <Link href="/registro" className={linkStyles}>
          Crear cuenta
        </Link>
      )}
    </div>
  );
}
