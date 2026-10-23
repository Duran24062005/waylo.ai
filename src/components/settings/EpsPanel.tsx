"use client";

import { useState } from "react";
import { useRemaining } from "@/components/chat/useRemaining";
import { TextField } from "@/components/auth/TextField";
import { buttonSoft } from "@/components/ui/buttons";
import { EPS_IDS, EPS_NAMES, type EpsId } from "@/data/eps";
import { useI18n } from "@/i18n/I18nProvider";
import { CEDULA_PATTERN, CODE_LENGTH, type EpsPatch, type EpsState } from "@/lib/eps";
import { cn } from "@/lib/utils";
import { formatWait } from "@/lib/wait";
import { Combobox } from "./Combobox";
import { OtpInput } from "./OtpInput";
import { Setting, SettingsCard } from "./SettingsCard";
import { SignedOut } from "./SignedOut";
import { useSaveStatus } from "./useSaveStatus";

const NONE = "none";
const CEDULA_MAX = 12;

/** The EPS of the person: which one, their ID number, the temporary code it sent, and the authorization for the bot. */
export function EpsPanel({ eps: initial }: { eps: EpsState | null }) {
  const { t } = useI18n();
  const copy = t.settings.eps;
  const { status, track } = useSaveStatus();
  const [eps, setEps] = useState(initial);
  const [cedula, setCedula] = useState("");
  const [cedulaInvalid, setCedulaInvalid] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  // Counts down on screen. When it reaches zero the code is as good as gone, with no reload.
  const left = useRemaining(eps?.codigoVenceEn ?? undefined);

  if (!eps) return <SignedOut title={copy.title} />;

  const codeActive = eps.codigoVenceEn !== null && left !== 0;
  const access = eps.acceso && left !== 0;

  /** Saves a change. The server answers with the new state, which replaces what is on screen. */
  async function save(patch: EpsPatch): Promise<{ ok: boolean; error?: string }> {
    let error: string | undefined;
    const ok = await track(async () => {
      const response = await fetch("/api/eps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; eps?: EpsState } | null;
      if (response.ok && body?.eps) {
        setEps(body.eps);
        return true;
      }
      error = body?.error;
      return false;
    });
    return { ok, error };
  }

  async function saveCedula() {
    const value = cedula.trim();
    if (!value) return;
    if (!CEDULA_PATTERN.test(value)) return setCedulaInvalid(true);
    const result = await save({ cedula: value });
    if (result.ok) setCedula("");
  }

  async function changeCode(next: string) {
    setCode(next);
    setCodeError(null);
    if (next.length < CODE_LENGTH) return;
    const result = await save({ codigo: next });
    // Whatever the answer, the digits do not stay on screen.
    setCode("");
    if (!result.ok) setCodeError(result.error === "not_authorized" ? copy.codeNeedsAuth : copy.codeError);
  }

  async function authorize(next: boolean) {
    // Shown at once; if it could not be saved the server's state comes back as it was.
    const before = eps;
    setEps((current) => (current ? { ...current, autorizado: next, ...(next ? {} : { codigoVenceEn: null, acceso: false }) } : current));
    const result = await save({ autoriza: next });
    if (!result.ok) setEps(before);
  }

  const options = [
    { value: NONE, label: copy.epsNone },
    ...EPS_IDS.map((id) => ({ value: id, label: EPS_NAMES[id] })),
  ];

  return (
    <SettingsCard title={copy.title} status={status}>
      <p
        role="status"
        className="flex items-center gap-2.5 rounded-xl bg-surface px-4 py-3 text-sm font-medium text-text shadow-inset"
      >
        <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", access ? "bg-success" : "bg-text-muted")} />
        {access ? copy.statusActive : copy.statusInactive}
      </p>

      <Combobox
        label={copy.epsLabel}
        placeholder={copy.epsNone}
        searchPlaceholder=""
        noResults=""
        clearLabel=""
        searchable={false}
        clearable={false}
        options={options}
        value={eps.eps ?? NONE}
        onChange={(value) => void save({ eps: value === NONE || value === null ? null : (value as EpsId) })}
      />

      <div className="flex flex-col gap-1.5">
        <TextField
          label={copy.cedulaLabel}
          name="cedula"
          inputMode="numeric"
          autoComplete="off"
          maxLength={CEDULA_MAX}
          placeholder={eps.cedula ?? copy.cedulaPlaceholder}
          value={cedula}
          error={cedulaInvalid ? copy.cedulaError : undefined}
          onChange={(event) => {
            setCedula(event.target.value.replace(/\D/g, "").slice(0, CEDULA_MAX));
            setCedulaInvalid(false);
          }}
          onBlur={() => void saveCedula()}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        />
        {eps.cedula ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
            <span>{copy.cedulaSaved(eps.cedula)}</span>
            <button
              type="button"
              onClick={() => void save({ cedula: null })}
              className="cursor-pointer font-semibold text-text underline underline-offset-4 hover:no-underline"
            >
              {copy.remove}
            </button>
          </div>
        ) : null}
      </div>

      <Setting label={copy.codeLabel} hint={eps.autorizado ? copy.codeHint : copy.codeNeedsAuth}>
        <OtpInput
          value={code}
          onChange={(next) => void changeCode(next)}
          length={CODE_LENGTH}
          label={copy.codeLabel}
          disabled={!eps.autorizado}
          invalid={Boolean(codeError)}
        />
        {codeError ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {codeError}
          </p>
        ) : null}
        {codeActive ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text">
            <span>{copy.codeActive(formatWait(left ?? 0, t.common))}</span>
            <button
              type="button"
              onClick={() => void save({ codigo: null })}
              className="cursor-pointer font-semibold underline underline-offset-4 hover:no-underline"
            >
              {copy.remove}
            </button>
          </div>
        ) : null}
      </Setting>

      <Setting label={copy.authLabel}>
        <label className={cn(buttonSoft, "min-h-0 cursor-pointer items-start justify-start gap-3 rounded-xl px-4 py-3.5 text-left font-normal shadow-soft")}>
          <input
            type="checkbox"
            checked={eps.autorizado}
            onChange={(event) => void authorize(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          />
          <span className="text-sm leading-snug text-text">{copy.authText}</span>
        </label>
        <p className="text-sm text-text-muted">{copy.authHint}</p>
      </Setting>
    </SettingsCard>
  );
}
