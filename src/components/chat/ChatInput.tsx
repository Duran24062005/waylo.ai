"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon, Attachment01Icon } from "@hugeicons/core-free-icons";
import { duration, easing } from "@/design/motion";
import { useT } from "@/i18n/I18nProvider";
import { ACCEPT, MAX_ATTACHMENTS } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import { AttachmentChip } from "./AttachmentChip";
import type { DraftAttachment } from "./useAttachments";

interface ChatInputProps {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** The files about to be sent with the message. */
  attachments: DraftAttachment[];
  /** Why a file was left out, such as too many at once. */
  attachNotice: string | null;
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
}

const MAX_HEIGHT = 176;

export function ChatInput({
  value,
  pending,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  attachments,
  attachNotice,
  onAttach,
  onRemoveAttachment,
}: ChatInputProps) {
  const t = useT();
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const reading = attachments.some((item) => item.status === "loading");
  const hasFiles = attachments.some((item) => item.status === "ready");
  // A message can go with only files: the chat words it. Not while a file is still being read.
  const canSend = (value.trim().length > 0 || hasFiles) && !pending && !reading;
  const full = attachments.filter((item) => item.status !== "error").length >= MAX_ATTACHMENTS;

  // Grows with the text up to a limit, then scrolls.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function pick(files: FileList | null) {
    if (files && files.length > 0) onAttach(Array.from(files));
    // The same file can be picked again after it was taken out.
    if (picker.current) picker.current.value = "";
  }

  // A photo copied to the clipboard (a screenshot) is attached; pasted text goes in as usual.
  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    onAttach(files);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) onAttach(Array.from(event.dataTransfer.files));
  }

  return (
    <form
      onSubmit={onSubmit}
      method="post"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <div
        className={cn(
          // No borders: depth tells the state. Resting is raised, hover lifts it, focus sinks it like a field.
          "group relative flex flex-col rounded-3xl bg-surface-raised",
          "transition-transform duration-[var(--duration-base)] ease-standard",
          "hover:-translate-y-0.5 focus-within:translate-y-0 focus-within:hover:translate-y-0",
        )}
      >
        {/*
          Shadows can't be interpolated between an outer and an inset one, so each state is its own layer
          and the layers cross-fade. That is what makes hover to focus a smooth transition.
        */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl shadow-soft",
            "transition-opacity duration-[var(--duration-base)] ease-standard",
            "group-hover:opacity-0 group-focus-within:opacity-0",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl opacity-0 shadow-raised",
            "transition-opacity duration-[var(--duration-base)] ease-standard",
            "group-hover:opacity-100 group-focus-within:opacity-0 group-focus-within:group-hover:opacity-0",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl opacity-0 shadow-inset",
            "transition-opacity duration-[var(--duration-slow)] ease-standard",
            "group-focus-within:opacity-100",
          )}
        />
        <AnimatePresence initial={false}>
          {attachments.length > 0 && (
            <motion.div
              key="tray"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: duration.base, ease: easing.standard }}
              className="relative overflow-hidden"
            >
              <div className="flex flex-col gap-2 px-3 pt-3">
                <ul className="flex flex-wrap gap-2">
                  <AnimatePresence initial={false}>
                    {attachments.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: duration.fast, ease: easing.standard }}
                        className="min-w-0 max-w-full"
                      >
                        <AttachmentChip
                          attachment={item}
                          status={item.status}
                          error={item.error}
                          onRemove={() => onRemoveAttachment(item.id)}
                          className="sm:max-w-64"
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <p role={attachNotice ? "alert" : undefined} className="px-1 text-xs text-text-muted">
                  {attachNotice ?? t.chat.attach.privacy}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-0.5 py-2 pl-1.5 pr-2 sm:gap-1 sm:pl-2">
          <input
            ref={picker}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            tabIndex={-1}
            onChange={(event) => pick(event.target.files)}
          />
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={full || pending}
            aria-label={t.chat.attach.label}
            title={t.chat.attach.hint}
            className={cn(
              "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted sm:size-10",
              "transition-colors duration-[var(--duration-base)] ease-standard hover:bg-surface hover:text-text",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted",
            )}
          >
            <HugeiconsIcon icon={Attachment01Icon} size={20} strokeWidth={2.25} aria-hidden />
          </button>

          <label className="sr-only" htmlFor="mensaje">
            {t.chat.inputLabel}
          </label>
          <textarea
            ref={ref}
            id="mensaje"
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={t.chat.placeholder}
            autoComplete="off"
            enterKeyHint="send"
            className="relative max-h-44 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 pl-0.5 text-base text-text outline-none sm:pl-1 placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t.chat.send}
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground",
              "lift lift-sm transition-opacity",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-30",
            )}
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={20} strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease: easing.standard }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-surface-raised/90 text-sm font-medium text-text shadow-raised"
            >
              {t.chat.attach.drop}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
