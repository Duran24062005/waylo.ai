"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { buttonPrimary } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { cn } from "@/lib/utils";

/** Shown when a visitor without an account has used up the free replies and tries to write. */
export function GuestLimitNotice() {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easing.standard }}
      className="flex flex-col gap-3 rounded-2xl bg-surface-raised p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-heading text-base font-semibold text-text">Llegaste a tu límite gratuito</p>
        <p className="mt-0.5 text-sm text-text-muted">Inicia sesión o crea una cuenta para seguir conversando sin límite.</p>
      </div>
      <Link href="/login" className={cn(buttonPrimary, "min-h-11 shrink-0 px-5 text-base")}>
        Iniciar sesión o registrarme
      </Link>
    </motion.div>
  );
}
