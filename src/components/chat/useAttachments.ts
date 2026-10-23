"use client";

import { useCallback, useRef, useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { MAX_ATTACHMENTS, MAX_DOCUMENT_BYTES } from "@/lib/attachments";
import { AttachError, isPhoto, preparePhoto, readDocument, type AttachFailure } from "@/lib/attachments-client";
import type { Attachment } from "@/lib/types";

export interface DraftAttachment extends Attachment {
  status: "loading" | "ready" | "error";
  /** Why it was not taken, in the language on screen. */
  error?: string;
}

/** The files the patient is about to send: each is read as soon as it is picked, so a bad one is told at once. */
export function useAttachments() {
  const copy = useT().chat.attach;
  const [items, setItems] = useState<DraftAttachment[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const itemsRef = useRef<DraftAttachment[]>([]);

  const commit = useCallback((next: DraftAttachment[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<DraftAttachment>) =>
      commit(itemsRef.current.map((item) => (item.id === id ? { ...item, ...changes } : item))),
    [commit],
  );

  const say = useCallback(
    (failure: AttachFailure) =>
      ({
        unsupported: copy.unsupported,
        too_large: copy.tooLarge(MAX_DOCUMENT_BYTES / (1024 * 1024)),
        empty: copy.noText,
        failed: copy.failed,
      })[failure],
    [copy],
  );

  const add = useCallback(
    (files: File[]) => {
      setNotice(null);
      const room = MAX_ATTACHMENTS - itemsRef.current.filter((item) => item.status !== "error").length;
      if (files.length > room) setNotice(copy.tooMany(MAX_ATTACHMENTS));

      for (const file of files.slice(0, Math.max(0, room))) {
        const id = crypto.randomUUID();
        const kind = isPhoto(file) ? "image" : "document";
        commit([...itemsRef.current, { id, name: file.name, kind, status: "loading" }]);

        const work =
          kind === "image"
            ? preparePhoto(file).then((dataUrl) => ({ dataUrl }))
            : readDocument(file).then(({ text, truncated }) => ({ text, truncated }));
        work
          .then((content) => patch(id, { ...content, status: "ready" }))
          .catch((error) => patch(id, { status: "error", error: say(error instanceof AttachError ? error.failure : "failed") }));
      }
    },
    [commit, copy, patch, say],
  );

  const remove = useCallback((id: string) => commit(itemsRef.current.filter((item) => item.id !== id)), [commit]);

  const clear = useCallback(() => {
    commit([]);
    setNotice(null);
  }, [commit]);

  /** Puts files back, such as when a message was not answered and returns to the input. */
  const restore = useCallback(
    (files: Attachment[] | undefined) =>
      commit(
        (files ?? [])
          .filter((file) => file.text || file.dataUrl)
          .map((file) => ({ ...file, status: "ready" as const })),
      ),
    [commit],
  );

  const ready: Attachment[] = items
    .filter((item) => item.status === "ready")
    .map(({ id, name, kind, text, dataUrl, truncated }) => ({ id, name, kind, text, dataUrl, truncated }));

  return {
    items,
    notice,
    ready,
    busy: items.some((item) => item.status === "loading"),
    add,
    remove,
    clear,
    restore,
  };
}
