"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";

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

  if (nombre) {
    return (
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <p className="font-heading text-body font-medium text-text">
          Hola, <span className="font-semibold">{nombre.split(" ")[0]}</span>
        </p>
        <button type="button" onClick={logout} disabled={leaving} className={cn(buttonSoft, "min-h-11 px-4 text-base")}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Link href="/login" className={cn(buttonSoft, "min-h-11 px-4 text-base")}>
        Iniciar sesión
      </Link>
      <Link href="/registro" className={cn(buttonPrimary, "min-h-11 px-4 text-base")}>
        Crear cuenta
      </Link>
    </div>
  );
}
