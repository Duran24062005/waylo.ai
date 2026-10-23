"use client";

import Link from "next/link";
import { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Mascot, type MascotState } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme";
import { buttonSoft } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";
import { ConversationList } from "./ConversationList";
import { StatusBadge } from "./StatusBadge";

interface ChatHeaderProps {
  mascotState: MascotState;
  onReset: () => void;
  conversations: Conversation[];
  activeId: string;
  onOpenConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

/** Compact top bar for small screens. The desktop layout uses ChatSidebar instead. */
export function ChatHeader({
  mascotState,
  onReset,
  conversations,
  activeId,
  onOpenConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
}: ChatHeaderProps) {
  const details = useRef<HTMLDetailsElement>(null);
  // Picking something closes the list, so the conversation is visible right away.
  const closeAfter = (action: () => void) => () => {
    action();
    if (details.current) details.current.open = false;
  };

  return (
    <header className="bg-surface-raised px-4 pb-4 pt-3 shadow-raised lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/inicio"
          className="rounded-sm font-script text-2xl text-title-gradient focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Waylo
        </Link>
        <ThemeToggle />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Mascot state={mascotState} size={56} className="shrink-0" />
        <StatusBadge state={mascotState} />
      </div>
      <details ref={details} className="group mt-3">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-heading text-base font-medium text-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          Conversaciones ({conversations.length})
        </summary>
        <div className="mt-2 flex flex-col gap-3">
          <button type="button" onClick={closeAfter(onReset)} className={cn(buttonSoft, "w-full")}>
            <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2.25} aria-hidden />
            Nueva conversación
          </button>
          <div className="scroll-soft max-h-60 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onOpen={(id) => closeAfter(() => onOpenConversation(id))()}
              onRename={onRenameConversation}
              onTogglePin={onTogglePinConversation}
              onDelete={onDeleteConversation}
            />
          </div>
        </div>
      </details>
    </header>
  );
}
