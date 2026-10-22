"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Mascot, type MascotState } from "@/components/mascot";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/theme";
import { buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { EpsField } from "./EpsField";
import { StatusBadge } from "./StatusBadge";

interface ChatSidebarProps {
  mascotState: MascotState;
  eps: string;
  onEpsChange: (value: string) => void;
  onReset: () => void;
  nombre?: string | null;
  /** The voice mode shows its own, larger mascot, so this one steps aside. */
  hideMascot?: boolean;
}

/** Desktop side panel. On small screens the same pieces live in ChatHeader. */
export function ChatSidebar({ mascotState, eps, onEpsChange, onReset, nombre, hideMascot }: ChatSidebarProps) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-8 bg-surface-raised p-8 shadow-raised lg:flex xl:w-96">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/inicio"
          className="rounded-sm font-script text-3xl text-title-gradient focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Waylo
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-5 text-center">
        {!hideMascot && <Mascot state={mascotState} size={176} />}
        <StatusBadge state={mascotState} />
      </div>

      <button type="button" onClick={onReset} className={cn(buttonSoft, "w-full")}>
        <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2.25} aria-hidden />
        Nueva conversación
      </button>

      <EpsField value={eps} onChange={onEpsChange} />

      <UserMenu nombre={nombre} className="mt-auto" />
    </aside>
  );
}
