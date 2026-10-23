"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  Doc01Icon,
  File01Icon,
  Image01Icon,
  Loading03Icon,
  Pdf01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/lib/types";

interface AttachmentChipProps {
  attachment: Attachment;
  status?: "loading" | "ready" | "error";
  error?: string;
  /** Only the chips about to be sent can be taken out. */
  onRemove?: () => void;
  className?: string;
}

function iconFor(attachment: Attachment): IconSvgElement {
  if (attachment.kind === "image") return Image01Icon;
  const extension = attachment.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return Pdf01Icon;
  if (extension === "docx") return Doc01Icon;
  if (extension === "xlsx" || extension === "csv") return Table01Icon;
  return File01Icon;
}

/** One attached file: a thumbnail for a photo, an icon for a document, with its name and what it is doing. */
export function AttachmentChip({ attachment, status = "ready", error, onRemove, className }: AttachmentChipProps) {
  const copy = useT().chat.attach;
  const isPhoto = attachment.kind === "image" && attachment.dataUrl;

  let subtitle: string = attachment.kind === "image" ? copy.image : copy.document;
  if (status === "loading") subtitle = copy.reading;
  else if (status === "error") subtitle = error ?? copy.failed;
  else if (attachment.truncated) subtitle = copy.tooLong;

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-surface p-1.5 shadow-soft",
        onRemove ? "pr-1.5" : "pr-3",
        className,
      )}
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised text-text-muted">
        {isPhoto && status === "ready" ? (
          // A data URL made in this browser, already small: nothing for the image optimizer to do.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={attachment.dataUrl} alt="" className="size-full object-cover" />
        ) : (
          <HugeiconsIcon
            icon={status === "loading" ? Loading03Icon : status === "error" ? AlertCircleIcon : iconFor(attachment)}
            size={20}
            strokeWidth={2}
            className={cn(status === "loading" && "motion-safe:animate-spin")}
            aria-hidden
          />
        )}
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-text">{attachment.name}</span>
        <span
          title={subtitle}
          className={cn("text-xs", status === "error" ? "line-clamp-3 text-text" : "truncate text-text-muted")}
        >
          {subtitle}
        </span>
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={copy.remove(attachment.name)}
          className={cn(
            "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted",
            "transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-surface-raised hover:text-text",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          )}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}
