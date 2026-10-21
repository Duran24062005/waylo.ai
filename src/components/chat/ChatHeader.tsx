"use client";

import Link from "next/link";
import { Mascot, type MascotState } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme";
import { EpsField } from "./EpsField";
import { StatusBadge } from "./StatusBadge";

interface ChatHeaderProps {
  mascotState: MascotState;
  eps: string;
  onEpsChange: (value: string) => void;
}

/** Compact top bar for small screens. The desktop layout uses ChatSidebar instead. */
export function ChatHeader({ mascotState, eps, onEpsChange }: ChatHeaderProps) {
  return (
    <header className="bg-surface-raised px-4 pb-4 pt-3 shadow-raised lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/inicio"
          className="rounded-sm font-script text-2xl text-title-gradient focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Waylo
        </Link>
        <ThemeToggle showLabel={false} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Mascot state={mascotState} size={56} className="shrink-0" />
        <StatusBadge state={mascotState} />
      </div>
      <details className="group mt-3">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-heading text-base font-medium text-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          Tu EPS (opcional)
        </summary>
        <div className="mt-2">
          <EpsField value={eps} onChange={onEpsChange} />
        </div>
      </details>
    </header>
  );
}
