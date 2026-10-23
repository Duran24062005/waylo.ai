"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Mascot, type MascotState } from "@/components/mascot";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/theme";
import { buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";
import { ConversationList } from "./ConversationList";
import { StatusBadge } from "./StatusBadge";

interface ChatSidebarProps {
  mascotState: MascotState;
  onReset: () => void;
  nombre?: string | null;
  /** The voice mode shows its own, larger mascot, so this one steps aside. */
  hideMascot?: boolean;
  /** Free replies a visitor has left. Undefined for signed-in users. */
  guestLeft?: number;
  conversations: Conversation[];
  activeId: string;
  onOpenConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

/** Desktop side panel. On small screens the same pieces live in ChatHeader. */
export function ChatSidebar({
  mascotState,
  onReset,
  nombre,
  hideMascot,
  guestLeft,
  conversations,
  activeId,
  onOpenConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
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

      {/* Takes the free height and scrolls, so many conversations never push the profile off screen. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold text-text">Conversaciones</h2>
        <div data-lenis-prevent className="scroll-soft -mx-2 min-h-0 flex-1 overflow-y-auto px-2">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onOpen={onOpenConversation}
            onRename={onRenameConversation}
            onTogglePin={onTogglePinConversation}
            onDelete={onDeleteConversation}
          />
        </div>
      </div>

      <UserMenu nombre={nombre} guestLeft={guestLeft} />
    </aside>
  );
}
