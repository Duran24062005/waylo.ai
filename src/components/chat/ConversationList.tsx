"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Edit02Icon, MoreVerticalIcon, PinIcon, PinOffIcon } from "@hugeicons/core-free-icons";
import { duration, easing } from "@/design/motion";
import { TITLE_MAX_CHARS } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";
import { TypewriterText } from "./TypewriterText";

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

const ROW_GAP_PX = 4;

// A new row opens out from nothing. A deleted one slides away and closes the gap it leaves, so the rest do not jump.
const rowEnter = { opacity: 0, y: -8, height: 0, marginBottom: -ROW_GAP_PX };
const rowRest = { opacity: 1, y: 0, x: 0, scale: 1, height: "auto", marginBottom: 0 };
const rowLeave = { opacity: 0, x: -24, scale: 0.96, height: 0, marginBottom: -ROW_GAP_PX, overflow: "hidden" };
const rowTransition = {
  duration: duration.base,
  ease: easing.standard,
  // Rows that move (a pinned one rising, the ones under a deleted one closing up) glide a little slower, so it can be followed.
  layout: { duration: duration.slow, ease: easing.standard },
};

/** The pin drops in when a chat is pinned and shrinks away when it is not, moving the title with it. */
const pinHidden = { opacity: 0, scale: 0.3, rotate: -35, width: 0, marginRight: -8 };
const pinShown = { opacity: 1, scale: 1, rotate: 0, width: 13, marginRight: 0 };

/**
 * A title that types itself when the row is new or the title changes (the AI names the chat, or the patient renames it),
 * and shows plainly when the list is just loaded.
 */
function RowTitle({ text, animate }: { text: string; animate: boolean }) {
  const first = useRef(text);
  // Once a title starts typing it stays a typewriter, so it is not swapped for plain text halfway.
  const [typing, setTyping] = useState(animate);
  if (!typing && (animate || text !== first.current)) setTyping(true);
  if (!typing) return <span className="truncate">{text}</span>;
  return (
    <span className="truncate">
      <TypewriterText key={text} text={text} />
    </span>
  );
}

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
  // Rows made after the list appeared animate in; the ones loaded from storage are just there.
  const [openedAt] = useState(() => Date.now());
  // The title each row last showed. A row that is rebuilt (the rename field takes its place) still knows its old title.
  const shownTitles = useRef(new Map<string, string>());
  useEffect(() => {
    shownTitles.current = new Map(conversations.map((conversation) => [conversation.id, conversation.title]));
  }, [conversations]);

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
    <>
      {/* The list stays mounted when it empties, so the last row can leave with its animation. */}
      <AnimatePresence>
        {conversations.length === 0 && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: duration.base } }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            className="text-sm text-text-muted"
          >
            Tus conversaciones aparecerán aquí durante 7 días.
          </motion.p>
        )}
      </AnimatePresence>

      <ul className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {conversations.map((conversation) => {
            const active = conversation.id === activeId;
            const open = menuId === conversation.id;
            const fresh = conversation.createdAt >= openedAt;
            const before = shownTitles.current.get(conversation.id);
            const retitled = before !== undefined && before !== conversation.title;

            return (
              <motion.li
                key={conversation.id}
                layout="position"
                initial={fresh ? rowEnter : false}
                animate={rowRest}
                exit={rowLeave}
                transition={rowTransition}
                className="group relative"
              >
                {renamingId === conversation.id ? (
                  <RenameField
                    initial={conversation.title}
                    onCommit={(title) => {
                      onRename(conversation.id, title);
                      setRenamingId(null);
                    }}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpen(conversation.id)}
                      aria-current={active ? "true" : undefined}
                      aria-label={conversation.title}
                      title={conversation.title}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl py-2.5 pl-3 pr-10 text-left text-sm",
                        "transition-[box-shadow,background-color,color] duration-[var(--duration-base)] ease-standard",
                        focusRing,
                        active ? "bg-surface font-medium text-text shadow-inset" : "text-text-muted hover:bg-surface/60 hover:text-text",
                      )}
                    >
                      <AnimatePresence initial={false}>
                        {conversation.pinned && (
                          <motion.span
                            key="pin"
                            initial={pinHidden}
                            animate={pinShown}
                            exit={pinHidden}
                            transition={{ duration: duration.base, ease: easing.standard }}
                            className="grid shrink-0 place-items-center"
                          >
                            <HugeiconsIcon icon={PinIcon} size={13} strokeWidth={2.25} aria-label="Fijada" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <RowTitle text={conversation.title} animate={fresh || retitled} />
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
                  </>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </>
  );
}
