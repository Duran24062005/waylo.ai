"use client";

import { useState, type FormEvent } from "react";
import { LockPasswordIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { FieldError } from "@/components/auth/FieldError";
import { TextField } from "@/components/auth/TextField";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { useI18n } from "@/i18n/I18nProvider";
import { FORMAT_LOCALE } from "@/i18n/locales";
import { storageKey } from "@/lib/conversations";
import type { Profile } from "@/lib/profile";
import type { SessionInfo } from "@/lib/profile-db";
import { cn } from "@/lib/utils";
import { formatAgo } from "@/lib/wait";
import { Reveal } from "./Reveal";
import { SettingsCard } from "./SettingsCard";
import { useSettings } from "./SettingsProvider";
import { SignedOut } from "./SignedOut";

// The one color of the page that is not black or white: it only marks what cannot be undone.
const DANGER = "#c62828";

/** Changing the email asks for the current password. */
function EmailChange({ onChanged, onClose }: { onChanged: (email: string) => void; onClose: () => void }) {
  const t = useI18n().t.settings.account;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch("/api/perfil/correo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; email?: string } | null;
      if (response.ok && body?.email) {
        onChanged(body.email);
        onClose();
      } else if (body?.error === "invalid") setErrors({ email: t.emailErrors.invalid });
      else if (body?.error === "wrong_password") setErrors({ password: t.emailErrors.wrongPassword });
      else if (body?.error === "email_taken") setErrors({ email: t.emailErrors.taken });
      else setErrors({ form: t.emailErrors.generic });
    } catch {
      setErrors({ form: t.emailErrors.generic });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-inset">
      <TextField
        label={t.newEmail}
        name="new-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        leading={Mail01Icon}
        value={email}
        error={errors.email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        label={t.currentPassword}
        name="current-password"
        type="password"
        autoComplete="current-password"
        leading={LockPasswordIcon}
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {errors.form ? <FieldError id="email-change-error">{errors.form}</FieldError> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || !email.trim() || !password} className={cn(buttonPrimary, "min-h-11 px-5 text-sm")}>
          {t.saveEmail}
        </button>
        <button type="button" onClick={onClose} className={cn(buttonSoft, "min-h-11 px-5 text-sm")}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

/** The address of the account, with a simple "Change" beside it that opens the form below. */
function EmailSection({ profile, onChanged }: { profile: Profile; onChanged: (email: string) => void }) {
  const t = useI18n().t.settings.account;
  const [open, setOpen] = useState(false);

  return (
    <SettingsCard title={t.email}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <TextField label={t.email} hideLabel name="email" type="email" leading={Mail01Icon} value={profile.email} readOnly aria-readonly />
        </div>
        {profile.tienePassword ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={open}
            aria-expanded={open}
            aria-controls="email-change"
            className={cn(buttonSoft, "min-h-11 shrink-0 px-5 text-sm")}
          >
            {t.change}
          </button>
        ) : null}
      </div>
      {profile.tienePassword ? null : <p className="-mt-3 text-sm text-text-muted">{t.emailGoogle}</p>}
      <Reveal show={open} id="email-change">
        <EmailChange onChanged={onChanged} onClose={() => setOpen(false)} />
      </Reveal>
    </SettingsCard>
  );
}

function Sessions({ initial }: { initial: SessionInfo[] }) {
  const { t, locale } = useI18n();
  const copy = t.settings.account.sessions;
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const others = items.filter((item) => !item.actual);

  async function close(id: string) {
    setFailed(false);
    setMessage(null);
    const response = await fetch(`/api/sesiones/${id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) setItems((current) => current.filter((item) => item.id !== id));
    else setFailed(true);
  }

  async function closeOthers() {
    setFailed(false);
    const response = await fetch("/api/sesiones", { method: "DELETE" }).catch(() => null);
    if (!response?.ok) return setFailed(true);
    const body = (await response.json().catch(() => null)) as { closed?: number } | null;
    setItems((current) => current.filter((item) => item.actual));
    setMessage(copy.closed(body?.closed ?? others.length));
  }

  return (
    <SettingsCard title={copy.title}>
      <p className="-mt-3 text-sm text-text-muted">{copy.hint}</p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface p-4 shadow-inset">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-heading text-sm font-semibold text-text">
                {item.dispositivo || copy.unknownDevice}
                {item.actual ? (
                  <span className="rounded-full bg-text px-2.5 py-0.5 text-xs font-semibold text-surface">{copy.current}</span>
                ) : null}
              </p>
              <p className="text-sm text-text-muted">
                {copy.lastActivity(formatAgo(item.ultimaActividad, FORMAT_LOCALE[locale]))}
              </p>
            </div>
            {item.actual ? null : (
              <button type="button" onClick={() => void close(item.id)} className={cn(buttonSoft, "min-h-10 px-4 text-sm")}>
                {copy.close}
              </button>
            )}
          </li>
        ))}
      </ul>
      {others.length === 0 ? <p className="text-sm text-text-muted">{message ?? copy.noOthers}</p> : null}
      {others.length > 0 ? (
        <button type="button" onClick={() => void closeOthers()} className={cn(buttonSoft, "min-h-11 w-fit px-5 text-sm")}>
          {copy.closeOthers}
        </button>
      ) : null}
      {failed ? (
        <p role="alert" className="text-sm font-semibold text-danger">
          {copy.failed}
        </p>
      ) : null}
    </SettingsCard>
  );
}

/** Deleting the account for good. It asks again who is asking: the password, or the account's email for Google accounts. */
function DeleteAccount({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const copy = t.settings.security;
  const { close } = useSettings();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function fold() {
    setOpen(false);
    setValue("");
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/cuenta", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile.tienePassword ? { password: value } : { email: value }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (response.ok) {
        // The conversations kept in this browser belong to the account, so they go with it.
        try {
          if (body?.id) window.localStorage.removeItem(storageKey(body.id));
        } catch {
          // Storage can be blocked; nothing to clear then.
        }
        close();
        return;
      }
      setError(
        body?.error === "wrong_password"
          ? copy.errors.wrongPassword
          : body?.error === "mismatch"
            ? copy.errors.mismatch
            : copy.errors.generic,
      );
    } catch {
      setError(copy.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsCard title={copy.deleteTitle}>
      <p className="-mt-3 text-sm text-text-muted">{copy.deleteText}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={open}
        aria-expanded={open}
        aria-controls="delete-account"
        className={cn(buttonSoft, "min-h-11 w-fit px-5 text-sm ring-2 ring-[#c62828]/45")}
        style={{ color: DANGER }}
      >
        {copy.deleteAction}
      </button>
      <Reveal show={open} id="delete-account">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-inset">
          <TextField
            label={profile.tienePassword ? copy.confirmPassword : copy.confirmEmail}
            name="confirm"
            type={profile.tienePassword ? "password" : "email"}
            autoComplete={profile.tienePassword ? "current-password" : "off"}
            leading={profile.tienePassword ? LockPasswordIcon : Mail01Icon}
            value={value}
            error={error ?? undefined}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className={cn(buttonSoft, "min-h-11 bg-[#c62828] px-5 text-sm text-white")}
              style={{ backgroundColor: DANGER, color: "#fff" }}
            >
              {copy.confirmAction}
            </button>
            <button type="button" onClick={fold} className={cn(buttonSoft, "min-h-11 px-5 text-sm")}>
              {t.settings.account.cancel}
            </button>
          </div>
        </form>
      </Reveal>
    </SettingsCard>
  );
}

interface SecurityPanelProps {
  profile: Profile | null;
  sessions: SessionInfo[];
}

/** Security: the account's email, the devices it is open on, and, last of all, deleting it. */
export function SecurityPanel({ profile: initial, sessions }: SecurityPanelProps) {
  const t = useI18n().t.settings;
  const [profile, setProfile] = useState(initial);

  if (!profile) return <SignedOut title={t.nav.security} />;

  return (
    <>
      <EmailSection profile={profile} onChanged={(email) => setProfile((p) => (p ? { ...p, email } : p))} />
      <Sessions initial={sessions} />
      <DeleteAccount profile={profile} />
    </>
  );
}
