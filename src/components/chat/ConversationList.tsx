"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Edit02Icon, MoreVerticalIcon, PinIcon, PinOffIcon } from "@hugeicons/core-free-icons";
import { TITLE_MAX_CHARS } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const menuItem = cn(
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text outline-none",
  "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface focus-visible:bg-surface",
);

/** The title as a field, with a counter. Enter or leaving the field saves; Escape cancels. */
function RenameField({ initial, onCommit, onCancel }: { initial: string; onCommit: (title: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  // Enter and the blur that follows it must not save twice.
  const finished = useRef(false);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  function finish(save: boolean) {
    if (finished.current) return;
    finished.current = true;
    if (save) onCommit(value);
    else onCancel();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  }

  return (
    <div>
      <input
        ref={input}
        value={value}
        maxLength={TITLE_MAX_CHARS}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => finish(true)}
        aria-label="Nuevo nombre de la conversación"
        className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm text-text shadow-inset outline-none field-focus"
      />
      <p
        aria-live="polite"
        className={cn("mt-1 px-1 text-right text-xs", value.length >= TITLE_MAX_CHARS ? "text-text" : "text-text-muted")}
      >
        {value.length}/{TITLE_MAX_CHARS}
        {value.length >= TITLE_MAX_CHARS && " · límite alcanzado"}
      </p>
    </div>
  );
}

/** Saved conversations, pinned first and then newest. They stay for a week, and fifteen at most. */
export function ConversationList({ conversations, activeId, onOpen, onRename, onTogglePin, onDelete }: ConversationListProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  // After choosing "Renombrar" the focus belongs to the field, not back to the three dots.
  const keepFocus = useRef(false);

  if (conversations.length === 0) {
    return <p className="text-sm text-text-muted">Tus conversaciones aparecerán aquí durante 7 días.</p>;
  }

  function choose(action: () => void, toField = false) {
    keepFocus.current = toField;
    setMenuId(null);
    action();
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <ul className="flex flex-col gap-1">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        const open = menuId === conversation.id;

        if (renamingId === conversation.id) {
          return (
            <li key={conversation.id}>
              <RenameField
                initial={conversation.title}
                onCommit={(title) => {
                  onRename(conversation.id, title);
                  setRenamingId(null);
                }}
                onCancel={() => setRenamingId(null)}
              />
            </li>
          );
        }

        return (
          <li key={conversation.id} className="group relative">
            <button
              type="button"
              onClick={() => onOpen(conversation.id)}
              aria-current={active ? "true" : undefined}
              title={conversation.title}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl py-2.5 pl-3 pr-10 text-left text-sm",
                "transition-[box-shadow,background-color,color] duration-[var(--duration-base)] ease-standard",
                focusRing,
                active ? "bg-surface font-medium text-text shadow-inset" : "text-text-muted hover:bg-surface/60 hover:text-text",
              )}
            >
              {conversation.pinned && (
                <HugeiconsIcon icon={PinIcon} size={13} strokeWidth={2.25} className="shrink-0" aria-label="Fijada" />
              )}
              <span className="truncate">{conversation.title}</span>
            </button>

            <Popover.Root open={open} onOpenChange={(next) => setMenuId(next ? conversation.id : null)}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label={`Opciones de la conversación ${conversation.title}`}
                  aria-haspopup="menu"
                  className={cn(
                    "absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-text-muted",
                    "transition-[opacity,background-color,color] duration-[var(--duration-fast)] ease-standard hover:bg-surface hover:text-text",
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:bg-surface data-[state=open]:text-text data-[state=open]:opacity-100",
                    "[@media(hover:none)]:opacity-100",
                    focusRing,
                  )}
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} strokeWidth={2.25} aria-hidden />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  role="menu"
                  aria-label={`Opciones de ${conversation.title}`}
                  align="end"
                  sideOffset={4}
                  collisionPadding={12}
                  onKeyDown={onMenuKeyDown}
                  onCloseAutoFocus={(event) => {
                    if (keepFocus.current) event.preventDefault();
                    keepFocus.current = false;
                  }}
                  className="popover-motion z-50 min-w-44 rounded-xl bg-surface-raised p-1.5 text-text shadow-raised"
                >
                  <button type="button" role="menuitem" className={menuItem} onClick={() => choose(() => setRenamingId(conversation.id), true)}>
                    <HugeiconsIcon icon={Edit02Icon} size={17} strokeWidth={2} aria-hidden />
                    Renombrar
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => choose(() => onTogglePin(conversation.id))}>
                    <HugeiconsIcon icon={conversation.pinned ? PinOffIcon : PinIcon} size={17} strokeWidth={2} aria-hidden />
                    {conversation.pinned ? "Desfijar" : "Fijar"}
                  </button>
                  {/* A faint line keeps the destructive option apart from the other two. */}
                  <div role="separator" className="mx-2 my-1.5 h-px bg-text/10" />
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(menuItem, "text-[#c62828]")}
                    onClick={() => choose(() => onDelete(conversation.id))}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={2} aria-hidden />
                    Eliminar
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </li>
        );
      })}
    </ul>
  );
}
