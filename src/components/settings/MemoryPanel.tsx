"use client";

import { useEffect, useState } from "react";
import { buttonSoft } from "@/components/ui/buttons";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CLINICAL_MEMORY_CATEGORIES,
  type ClinicalMemory,
  type ClinicalMemoryCategory,
  type ClinicalMemoryStatus,
} from "@/lib/clinical-memory";
import { cn } from "@/lib/utils";
import { Setting, SettingsCard } from "./SettingsCard";
import { SignedOut } from "./SignedOut";

function MemoryItem({ memory, onChange }: { memory: ClinicalMemory; onChange: (next: ClinicalMemory) => void }) {
  const { t } = useI18n();
  const copy = t.settings.memory;
  const [category, setCategory] = useState<ClinicalMemoryCategory>(memory.category);
  const [value, setValue] = useState(memory.value);
  const [status, setStatus] = useState<ClinicalMemoryStatus>(memory.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/memoria-clinica/${memory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, value, status }),
      });
      const body = (await response.json().catch(() => null)) as { memory?: ClinicalMemory } | null;
      if (!response.ok || !body?.memory) throw new Error("memory update failed");
      onChange(body.memory);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(copy.confirmDelete)) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/memoria-clinica/${memory.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("memory delete failed");
      onChange({ ...memory, id: "" });
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-inset">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <Setting label={copy.categoryLabel}>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ClinicalMemoryCategory)}
            className="min-h-11 rounded-lg bg-surface-raised px-3 text-sm text-text shadow-soft outline-none focus-visible:outline-3 focus-visible:outline-focus-ring"
          >
            {CLINICAL_MEMORY_CATEGORIES.map((option) => (
              <option key={option} value={option}>{copy.categories[option]}</option>
            ))}
          </select>
        </Setting>
        <Setting label={copy.valueLabel}>
          <input
            value={value}
            maxLength={500}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-11 rounded-lg bg-surface-raised px-3 text-sm text-text shadow-soft outline-none focus-visible:outline-3 focus-visible:outline-focus-ring"
          />
        </Setting>
      </div>
      <Setting label={copy.statusLabel}>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ClinicalMemoryStatus)}
          className="min-h-11 rounded-lg bg-surface-raised px-3 text-sm text-text shadow-soft outline-none focus-visible:outline-3 focus-visible:outline-focus-ring"
        >
          <option value="active">{copy.active}</option>
          <option value="resolved">{copy.resolved}</option>
        </select>
      </Setting>
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{copy.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={saving || !value.trim()} className={cn(buttonSoft, "min-h-10 px-4 text-sm")}>
          {saving ? t.settings.saving : copy.save}
        </button>
        <button type="button" onClick={() => void remove()} disabled={saving} className="min-h-10 cursor-pointer px-4 text-sm font-semibold text-danger underline underline-offset-4 hover:no-underline disabled:cursor-not-allowed disabled:opacity-60">
          {copy.delete}
        </button>
      </div>
    </article>
  );
}

export function MemoryPanel({ signedIn }: { signedIn: boolean }) {
  const { t } = useI18n();
  const copy = t.settings.memory;
  const [memories, setMemories] = useState<ClinicalMemory[]>([]);
  const [loading, setLoading] = useState(signedIn);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    let cancelled = false;
    void fetch("/api/memoria-clinica", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { memories?: ClinicalMemory[] } | null;
        if (!response.ok || !body?.memories) throw new Error("memory load failed");
        if (!cancelled) setMemories(body.memories);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (!signedIn) return <SignedOut title={copy.title} />;

  return (
    <SettingsCard title={copy.title}>
      <p className="text-base text-text-muted">{copy.hint}</p>
      {loading ? <p role="status" className="text-sm text-text-muted">{t.settings.loading}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{copy.error}</p> : null}
      {!loading && !error && memories.length === 0 ? <p className="text-sm text-text-muted">{copy.empty}</p> : null}
      <div className="flex flex-col gap-4">
        {memories.map((memory) => (
          <MemoryItem
            key={memory.id}
            memory={memory}
            onChange={(next) => {
              if (!next.id) setMemories((current) => current.filter((item) => item.id !== memory.id));
              else setMemories((current) => current.map((item) => (item.id === next.id ? next : item)));
            }}
          />
        ))}
      </div>
    </SettingsCard>
  );
}
