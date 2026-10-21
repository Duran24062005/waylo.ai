"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  birthYearOptions,
  isValidBirthDate,
  MONTHS_ES,
  type BirthDateError,
  type BirthDateInput,
} from "@/lib/birthdate";
import { AuthShell } from "./AuthShell";
import { FieldError } from "./FieldError";
import { PasswordToggle } from "./PasswordToggle";
import { SelectField, type SelectOption } from "./SelectField";
import { SubmitButton } from "./SubmitButton";
import { TextField } from "./TextField";
import { focusRing } from "./styles";
import { validateRegistro, type RegistroErrors } from "./validation";

const ERROR_COPY: Record<BirthDateError, string> = {
  incomplete: "Elige el día, el mes y el año.",
  invalid: "Esa fecha no existe. Revisa el día, el mes y el año.",
  future: "Esa fecha todavía no ha llegado. Revisa el año.",
  too_old: "Revisa el año. Debe ser de los últimos 120 años.",
};

const DAY_OPTIONS: SelectOption[] = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MONTH_OPTIONS: SelectOption[] = MONTHS_ES.map((name, i) => ({
  value: String(i + 1),
  label: name.charAt(0).toUpperCase() + name.slice(1),
}));

const toNumber = (value: string) => (value === "" ? null : Number(value));

export function RegistroForm() {
  const router = useRouter();
  const dateErrorId = useId();
  const consentErrorId = useId();
  const nombreRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [today] = useState(() => new Date());
  const yearOptions = useMemo<SelectOption[]>(
    () => birthYearOptions(today).map((year) => ({ value: String(year), label: String(year) })),
    [today],
  );

  const [parts, setParts] = useState({ day: "", month: "", year: "" });
  const [acepta, setAcepta] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RegistroErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const input: BirthDateInput = {
    day: toNumber(parts.day),
    month: toNumber(parts.month),
    year: toNumber(parts.year),
  };
  const result = isValidBirthDate(input, today);
  const allChosen = Boolean(parts.day && parts.month && parts.year);
  // A missing part is only an error after trying to continue; a bad combination shows as soon as it is chosen.
  const dateError = !result.valid && (submitted || allChosen) ? ERROR_COPY[result.error] : null;
  const dateDescribedBy = dateError ? dateErrorId : undefined;

  const update = (part: keyof typeof parts) => (event: React.ChangeEvent<HTMLSelectElement>) =>
    setParts((current) => ({ ...current, [part]: event.target.value }));

  const clearError = (field: keyof RegistroErrors) => () => {
    setFormError(null);
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const focusHandlers = {
    onFocus: () => setFieldFocused(true),
    onBlur: () => setFieldFocused(false),
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      nombre: String(data.get("nombre") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      acepta,
    };
    const nextErrors = validateRegistro(values);

    flushSync(() => {
      setSubmitted(true);
      setErrors(nextErrors);
      setFormError(null);
    });

    if (nextErrors.nombre) return nombreRef.current?.focus();
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    if (!result.valid || nextErrors.acepta) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: values.nombre,
          email: values.email,
          password: values.password,
          dia: input.day,
          mes: input.month,
          anio: input.year,
          acepta,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; campo?: string } | null;
        const message = body?.error ?? "No pudimos crear la cuenta. Intenta de nuevo.";
        if (body?.campo === "email") setErrors({ email: message });
        else setFormError(message);
        return;
      }
      router.push("/chat");
      router.refresh();
    } catch {
      setFormError("No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const mascotState = submitting
    ? "thinking"
    : formError
      ? "error"
      : fieldFocused
        ? "listening"
        : result.valid
          ? "success"
          : "idle";

  return (
    <AuthShell
      title="Crea tu cuenta"
      intro="Solo te pedimos lo necesario para orientarte mejor."
      mascotState={mascotState}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className={`inline-flex min-h-11 items-center rounded-sm px-1 font-heading font-semibold text-accent underline underline-offset-4 ${focusRing}`}
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} method="post" noValidate className="flex flex-col gap-6">
        <TextField
          ref={nombreRef}
          label="Nombre"
          name="nombre"
          autoComplete="name"
          error={errors.nombre}
          onChange={clearError("nombre")}
          {...focusHandlers}
        />
        <TextField
          ref={emailRef}
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
          onChange={clearError("email")}
          {...focusHandlers}
        />
        <TextField
          ref={passwordRef}
          label="Contraseña"
          name="password"
          type={passwordVisible ? "text" : "password"}
          autoComplete="new-password"
          error={errors.password}
          onChange={clearError("password")}
          trailing={(inputId) => (
            <PasswordToggle
              visible={passwordVisible}
              onToggle={() => setPasswordVisible((value) => !value)}
              controls={inputId}
            />
          )}
          {...focusHandlers}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-heading text-base font-medium text-text">Fecha de nacimiento</legend>
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-3">
            <SelectField
              label="Día"
              name="bday-day"
              autoComplete="bday-day"
              placeholder="Día"
              options={DAY_OPTIONS}
              value={parts.day}
              onChange={update("day")}
              invalid={Boolean(dateError)}
              describedBy={dateDescribedBy}
              {...focusHandlers}
            />
            <SelectField
              label="Mes"
              name="bday-month"
              autoComplete="bday-month"
              placeholder="Mes"
              options={MONTH_OPTIONS}
              value={parts.month}
              onChange={update("month")}
              invalid={Boolean(dateError)}
              describedBy={dateDescribedBy}
              {...focusHandlers}
            />
            <SelectField
              label="Año"
              name="bday-year"
              autoComplete="bday-year"
              placeholder="Año"
              options={yearOptions}
              value={parts.year}
              onChange={update("year")}
              invalid={Boolean(dateError)}
              describedBy={dateDescribedBy}
              {...focusHandlers}
            />
          </div>
          <div aria-live="polite" className="empty:hidden">
            {dateError ? <FieldError id={dateErrorId}>{dateError}</FieldError> : null}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 text-body text-text">
            <input
              type="checkbox"
              name="acepta"
              checked={acepta}
              onChange={(event) => {
                setAcepta(event.target.checked);
                clearError("acepta")();
              }}
              aria-invalid={errors.acepta ? true : undefined}
              aria-describedby={errors.acepta ? consentErrorId : undefined}
              className={`mt-1 size-6 shrink-0 cursor-pointer accent-[var(--accent)] ${focusRing}`}
            />
            <span>Autorizo que Waylo guarde mis datos para crear mi cuenta. Solo se usan para eso.</span>
          </label>
          {errors.acepta ? <FieldError id={consentErrorId}>{errors.acepta}</FieldError> : null}
        </div>

        <div role="alert" className="empty:hidden">
          {formError ? <FieldError id="registro-error">{formError}</FieldError> : null}
        </div>
        <SubmitButton loading={submitting}>Crear cuenta</SubmitButton>
      </form>
    </AuthShell>
  );
}
