"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSettings } from "./SettingsProvider";
import { LockPasswordIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { FieldError } from "@/components/auth/FieldError";
import { TextField } from "@/components/auth/TextField";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { CITIES } from "@/data/ciudades";
import { countryOptions } from "@/data/paises";
import { useI18n } from "@/i18n/I18nProvider";
import { FORMAT_LOCALE } from "@/i18n/locales";
import { NAME_MAX, NICKNAME_MAX, SEXES, type Profile, type Sex } from "@/lib/profile";
import type { SessionInfo } from "@/lib/profile-db";
import { cn } from "@/lib/utils";
import { formatAgo } from "@/lib/wait";
import { Combobox } from "./Combobox";
import { SegmentedControl } from "./SegmentedControl";
import { Setting, SettingsCard } from "./SettingsCard";
import { useSaveStatus } from "./useSaveStatus";

const NAME_CHARS = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u;
const NICKNAME_CHARS = /^[\p{L}\p{M}'’ .-]*$/u;

interface PatchResult {
  ok: boolean;
  invalid: boolean;
}

async function patchProfile(patch: Record<string, unknown>): Promise<PatchResult> {
  const response = await fetch("/api/perfil", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return { ok: response.ok, invalid: response.status === 400 };
}

function SignedOut() {
  const t = useI18n().t.settings.account;
  return (
    <SettingsCard title={t.title}>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-lg font-semibold text-text">{t.signedOutTitle}</p>
        <p className="text-base text-text-muted">{t.signedOutText}</p>
      </div>
      <Link href="/login" className={cn(buttonPrimary, "w-fit")}>
        {t.signIn}
      </Link>
    </SettingsCard>
  );
}

/** Changing the email asks for the current password. */
function EmailChange({ onChanged }: { onChanged: (email: string) => void }) {
  const t = useI18n().t.settings.account;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setEmail("");
    setPassword("");
    setErrors({});
  }

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
        close();
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

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonSoft, "min-h-11 w-fit px-4 text-sm")}>
        {t.changeEmail}
      </button>
    );
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
        <button type="button" onClick={close} className={cn(buttonSoft, "min-h-11 px-5 text-sm")}>
          {t.cancel}
        </button>
      </div>
    </form>
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

function SignOut() {
  const { t } = useI18n();
  const { close } = useSettings();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    // Closing the window refreshes the page, which now shows a visitor.
    close();
  }

  return (
    <SettingsCard title={t.profile.signOut}>
      <button type="button" onClick={() => void signOut()} disabled={busy} className={cn(buttonSoft, "min-h-11 w-fit px-5 text-sm")}>
        {t.profile.signOut}
      </button>
    </SettingsCard>
  );
}

interface AccountPanelProps {
  profile: Profile | null;
  sessions: SessionInfo[];
}

export function AccountPanel({ profile: initial, sessions }: AccountPanelProps) {
  const { t, locale } = useI18n();
  const copy = t.settings.account;
  const { status, track } = useSaveStatus();
  const [profile, setProfile] = useState(initial);
  const [name, setName] = useState(initial?.nombre ?? "");
  const [nickname, setNickname] = useState(initial?.apodo ?? "");
  const [errors, setErrors] = useState<{ nombre?: string; apodo?: string }>({});

  const cityOptions = useMemo(() => CITIES.map((city) => ({ value: city, label: city })), []);
  const countries = useMemo(() => countryOptions(locale).map((c) => ({ value: c.code, label: c.name })), [locale]);

  if (!profile) return <SignedOut />;

  async function saveText(field: "nombre" | "apodo", raw: string) {
    if (!profile) return;
    const value = raw.trim();
    const current = field === "nombre" ? profile.nombre : (profile.apodo ?? "");
    const valid = field === "nombre" ? value.length > 0 && value.length <= NAME_MAX && NAME_CHARS.test(value) : value.length <= NICKNAME_MAX && NICKNAME_CHARS.test(value);

    if (!valid) {
      setErrors((e) => ({ ...e, [field]: field === "nombre" && !value ? copy.errors.nameRequired : copy.errors.invalid }));
      return;
    }
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (value === current) return;

    let invalid = false;
    const ok = await track(async () => {
      const result = await patchProfile({ [field]: field === "apodo" ? value || null : value });
      invalid = result.invalid;
      return result.ok;
    });
    if (ok) setProfile((p) => (p ? { ...p, [field === "nombre" ? "nombre" : "apodo"]: field === "apodo" ? value || null : value } : p));
    else if (invalid) setErrors((e) => ({ ...e, [field]: copy.errors.invalid }));
  }

  async function saveChoice(patch: Partial<Pick<Profile, "sexo" | "ciudad" | "nacionalidad">>) {
    const before = profile;
    setProfile((p) => (p ? { ...p, ...patch } : p));
    const ok = await track(async () => (await patchProfile(patch)).ok);
    // A choice that could not be saved goes back to what was saved.
    if (!ok) setProfile(before);
  }

  return (
    <>
      <SettingsCard title={copy.title} status={status}>
        <TextField
          label={copy.fullName}
          name="nombre"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={name}
          error={errors.nombre}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((e) => ({ ...e, nombre: undefined }));
          }}
          onBlur={() => void saveText("nombre", name)}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        />

        <div className="flex flex-col gap-1.5">
          <TextField
            label={copy.nickname}
            name="apodo"
            autoComplete="nickname"
            maxLength={NICKNAME_MAX}
            value={nickname}
            error={errors.apodo}
            onChange={(event) => {
              setNickname(event.target.value);
              setErrors((e) => ({ ...e, apodo: undefined }));
            }}
            onBlur={() => void saveText("apodo", nickname)}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          />
          <p className="text-sm text-text-muted">{copy.nicknameHint}</p>
        </div>

        <div className="flex flex-col gap-3">
          <TextField
            label={copy.email}
            name="email"
            type="email"
            leading={Mail01Icon}
            value={profile.email}
            readOnly
            aria-readonly
          />
          {profile.tienePassword ? (
            <EmailChange onChanged={(email) => setProfile((p) => (p ? { ...p, email } : p))} />
          ) : (
            <p className="text-sm text-text-muted">{copy.emailGoogle}</p>
          )}
        </div>

        <Setting label={copy.sex}>
          <SegmentedControl<Sex | "">
            label={copy.sex}
            value={profile.sexo ?? ""}
            onChange={(value) => value && void saveChoice({ sexo: value })}
            options={SEXES.map((value) => ({ value, label: copy.sexOptions[value] }))}
          />
        </Setting>

        <div className="grid gap-6 lg:grid-cols-2">
          <Combobox
            label={copy.city}
            hint={copy.cityHint}
            placeholder={copy.choose}
            searchPlaceholder={copy.search}
            noResults={copy.noResults}
            clearLabel={copy.clear}
            options={cityOptions}
            value={profile.ciudad}
            onChange={(ciudad) => void saveChoice({ ciudad })}
          />
          <Combobox
            label={copy.nationality}
            placeholder={copy.choose}
            searchPlaceholder={copy.search}
            noResults={copy.noResults}
            clearLabel={copy.clear}
            options={countries}
            value={profile.nacionalidad}
            onChange={(nacionalidad) => void saveChoice({ nacionalidad })}
          />
        </div>
      </SettingsCard>

      <Sessions initial={sessions} />
      <SignOut />
    </>
  );
}
