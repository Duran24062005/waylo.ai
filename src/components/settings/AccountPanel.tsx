"use client";

import { useMemo, useState } from "react";
import { TextField } from "@/components/auth/TextField";
import { CITIES } from "@/data/ciudades";
import { countryOptions } from "@/data/paises";
import { useI18n } from "@/i18n/I18nProvider";
import { NAME_MAX, NICKNAME_MAX, SEXES, type Profile, type Sex } from "@/lib/profile";
import { Combobox } from "./Combobox";
import { FemaleIcon, MaleIcon } from "./GenderIcons";
import { SegmentedControl } from "./SegmentedControl";
import { Setting, SettingsCard } from "./SettingsCard";
import { SignedOut } from "./SignedOut";
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

const GENDER_ICONS = { masculino: <MaleIcon />, femenino: <FemaleIcon /> } as const;

/** Who the person is: name, nickname, gender, city and nationality. Each field saves on its own. */
export function AccountPanel({ profile: initial }: { profile: Profile | null }) {
  const { t, locale } = useI18n();
  const copy = t.settings.account;
  const { status, track } = useSaveStatus();
  const [profile, setProfile] = useState(initial);
  const [name, setName] = useState(initial?.nombre ?? "");
  const [nickname, setNickname] = useState(initial?.apodo ?? "");
  const [errors, setErrors] = useState<{ nombre?: string; apodo?: string }>({});

  const cityOptions = useMemo(() => CITIES.map((city) => ({ value: city, label: city })), []);
  const countries = useMemo(() => countryOptions(locale).map((c) => ({ value: c.code, label: c.name })), [locale]);

  if (!profile) return <SignedOut title={copy.title} />;

  async function saveText(field: "nombre" | "apodo", raw: string) {
    if (!profile) return;
    const value = raw.trim();
    const current = field === "nombre" ? profile.nombre : (profile.apodo ?? "");
    const valid =
      field === "nombre"
        ? value.length > 0 && value.length <= NAME_MAX && NAME_CHARS.test(value)
        : value.length <= NICKNAME_MAX && NICKNAME_CHARS.test(value);

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
    if (ok) {
      setProfile((p) => (p ? { ...p, [field === "nombre" ? "nombre" : "apodo"]: field === "apodo" ? value || null : value } : p));
    } else if (invalid) {
      setErrors((e) => ({ ...e, [field]: copy.errors.invalid }));
    }
  }

  async function saveChoice(patch: Partial<Pick<Profile, "sexo" | "ciudad" | "nacionalidad">>) {
    const before = profile;
    setProfile((p) => (p ? { ...p, ...patch } : p));
    const ok = await track(async () => (await patchProfile(patch)).ok);
    // A choice that could not be saved goes back to what was saved.
    if (!ok) setProfile(before);
  }

  return (
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

      <Setting label={copy.sex}>
        <SegmentedControl<Sex | "">
          label={copy.sex}
          value={profile.sexo ?? ""}
          onChange={(value) => value && void saveChoice({ sexo: value })}
          columns={2}
          options={SEXES.map((value) => ({
            value,
            label: copy.sexOptions[value],
            iconNode: GENDER_ICONS[value],
            iconOnly: true,
          }))}
        />
      </Setting>

      <div className="grid gap-6 lg:grid-cols-2">
        <Combobox
          label={copy.city}
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
  );
}
