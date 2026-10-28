"use client";

import { useState } from "react";
import { useRemaining } from "@/components/chat/useRemaining";
import { TextField } from "@/components/auth/TextField";
import { buttonSoft } from "@/components/ui/buttons";
import { EPS_IDS, EPS_NAMES, type EpsId } from "@/data/eps";
import { useI18n } from "@/i18n/I18nProvider";
import { CEDULA_PATTERN, CODE_LENGTH, CODE_PATTERN, type EpsPatch, type EpsState } from "@/lib/eps";
import type { IpsLinkState } from "@/lib/ips";
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
export function EpsPanel({ eps: initial, ips: initialIps }: { eps: EpsState | null; ips: IpsLinkState }) {
  const { t } = useI18n();
  const copy = t.settings.eps;
  const { status, track } = useSaveStatus();
  const [eps, setEps] = useState(initial);
  const [cedula, setCedula] = useState("");
  const [cedulaInvalid, setCedulaInvalid] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [ips, setIps] = useState(initialIps);
  const [ipsError, setIpsError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  // Counts down on screen. When it reaches zero the code is as good as gone, with no reload.
  const left = useRemaining(eps?.codigoVenceEn ?? undefined);

  if (!eps) return <SignedOut title={copy.title} />;

  const codeActive = eps.codigoVenceEn !== null && left !== 0;
  const access = eps.acceso && left !== 0;
  const ipsAccess = ips.status === "active";

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
    await save({ cedula: value });
  }

  async function changeCode(next: string) {
    setCode(next);
    setCodeError(null);
  }

  async function disconnect() {
    try {
      const response = await fetch("/api/ips/link", { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as IpsLinkState | { error?: string } | null;
      if (!response.ok || !body || !("status" in body)) throw new Error("disconnect failed");
      setIps(body);
      setIpsError(null);
    } catch {
      setIpsError(copy.connectionError);
    }
  }

  async function connect() {
    const documentNumber = cedula.trim();
    if (!eps || eps.eps !== "confianza" || !eps.autorizado || !CEDULA_PATTERN.test(documentNumber) || !CODE_PATTERN.test(code)) {
      setIpsError(copy.connectionRequirements);
      return;
    }
    setConnecting(true);
    setIpsError(null);
    try {
      const response = await fetch("/api/ips/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "CC", document_number: documentNumber, eps: "confianza", activation_code: code }),
      });
      const body = (await response.json().catch(() => null)) as IpsLinkState | { error?: string } | null;
      if (!response.ok || !body || !("status" in body)) {
        setIpsError(body && "error" in body && body.error === "LINK_INVALID" ? copy.connectionInvalid : copy.connectionError);
        return;
      }
      setIps(body);
      setCode("");
      setIpsError(null);
    } catch {
      setIpsError(copy.connectionError);
    } finally {
      setConnecting(false);
    }
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
        onChange={(value) => {
          const next = value === NONE || value === null ? null : (value as EpsId);
          if (ips.status === "active" && next !== "confianza") void disconnect();
          void save({ eps: next });
        }}
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
              onClick={() => {
                setCedula("");
                void save({ cedula: null });
              }}
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

      <div className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-4 shadow-inset">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-text">{copy.connectionLabel}</span>
          <span className={cn("size-2.5 rounded-full", ipsAccess ? "bg-success" : "bg-text-muted")} aria-hidden />
        </div>
        <p className="text-sm text-text-muted">
          {ips.status === "active"
            ? copy.connectionActive
            : ips.status === "expired"
              ? copy.connectionExpired
              : ips.status === "unavailable"
                ? copy.connectionUnavailable
                : copy.connectionInactive}
        </p>
        {ips.status === "active" ? (
          <button type="button" onClick={() => void disconnect()} className={cn(buttonSoft, "min-h-10 px-4 text-sm")}>
            {copy.disconnect}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting || !eps.autorizado || eps.eps !== "confianza" || !CEDULA_PATTERN.test(cedula.trim()) || !CODE_PATTERN.test(code)}
            className={cn(buttonSoft, "min-h-10 px-4 text-sm")}
          >
            {connecting ? copy.connecting : copy.connect}
          </button>
        )}
        {ipsError ? <p role="alert" className="text-sm font-semibold text-danger">{ipsError}</p> : null}
      </div>

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
