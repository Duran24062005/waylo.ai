"use client";

import { useState } from "react";
import { buttonSoft } from "@/components/ui/buttons";
import { useI18n } from "@/i18n/I18nProvider";
import type { ClinicalMemoryProposal } from "@/lib/clinical-memory";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "dismissed" | "error";

export function MemoryProposalCard({ proposal }: { proposal: ClinicalMemoryProposal }) {
  const { t } = useI18n();
  const copy = t.chat.memory;
  const [state, setState] = useState<SaveState>("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch("/api/memoria-clinica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });
      if (!response.ok) throw new Error("memory save failed");
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (state === "dismissed") return null;

  return (
    <div className="mt-2 flex w-full max-w-xl flex-col gap-3 rounded-xl bg-surface p-4 shadow-inset">
      <div>
        <p className="font-heading text-sm font-semibold text-text">{copy.title}</p>
        <p className="mt-1 text-sm text-text-muted">{copy.hint}</p>
      </div>
      <p className="rounded-lg bg-surface-raised px-3 py-2 text-sm text-text shadow-soft">
        <span className="font-semibold">{proposal.value}</span>
      </p>
      {state === "error" ? <p role="alert" className="text-sm font-semibold text-danger">{copy.error}</p> : null}
      {state === "saved" ? (
        <p role="status" className="text-sm font-semibold text-text">{copy.saved}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void save()} disabled={state === "saving"} className={cn(buttonSoft, "min-h-10 px-4 text-sm")}>
            {state === "saving" ? copy.saving : copy.save}
          </button>
          <button type="button" onClick={() => setState("dismissed")} disabled={state === "saving"} className="min-h-10 cursor-pointer rounded-lg px-4 text-sm font-semibold text-text-muted underline underline-offset-4 hover:text-text disabled:cursor-not-allowed disabled:opacity-60">
            {copy.dismiss}
          </button>
        </div>
      )}
    </div>
  );
}
