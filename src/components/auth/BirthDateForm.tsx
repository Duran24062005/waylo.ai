"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  birthYearOptions,
  isValidBirthDate,
  MONTHS_ES,
  type BirthDateError,
  type BirthDateInput,
} from "@/lib/birthdate";
import { AuthShell } from "./AuthShell";
import { FieldError } from "./FieldError";
import { SelectField, type SelectOption } from "./SelectField";
import { SubmitButton } from "./SubmitButton";
import { focusRing } from "./styles";

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

export function BirthDateForm() {
  const router = useRouter();
  const errorId = useId();
  const [today] = useState(() => new Date());
  const yearOptions = useMemo<SelectOption[]>(
    () => birthYearOptions(today).map((year) => ({ value: String(year), label: String(year) })),
    [today],
  );

  const [parts, setParts] = useState({ day: "", month: "", year: "" });
  const [submitted, setSubmitted] = useState(false);

  const input: BirthDateInput = {
    day: toNumber(parts.day),
    month: toNumber(parts.month),
    year: toNumber(parts.year),
  };
  const result = isValidBirthDate(input, today);
  const allChosen = Boolean(parts.day && parts.month && parts.year);
  // A missing part is only an error after trying to continue; a bad combination shows as soon as it is chosen.
  const errorCode = !result.valid && (submitted || allChosen) ? result.error : null;
  const describedBy = errorCode ? errorId : undefined;

  const update = (part: keyof typeof parts) => (event: React.ChangeEvent<HTMLSelectElement>) =>
    setParts((current) => ({ ...current, [part]: event.target.value }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Visual prototype: the birth date lives only in this component's state. No network call, nothing is stored.
    setSubmitted(true);
    if (result.valid) {
      router.push("/chat");
    }
  }

  return (
    <AuthShell
      title="Tu fecha de nacimiento"
      intro="Elige tu día, mes y año."
      mascotState={result.valid ? "success" : "idle"}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className={`inline-flex min-h-11 items-center rounded-sm px-1 font-bold text-accent underline underline-offset-4 ${focusRing}`}
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} method="post" noValidate className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Fecha de nacimiento</legend>
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-3">
            <SelectField
              label="Día"
              name="bday-day"
              autoComplete="bday-day"
              placeholder="Día"
              options={DAY_OPTIONS}
              value={parts.day}
              onChange={update("day")}
              invalid={Boolean(errorCode)}
              describedBy={describedBy}
            />
            <SelectField
              label="Mes"
              name="bday-month"
              autoComplete="bday-month"
              placeholder="Mes"
              options={MONTH_OPTIONS}
              value={parts.month}
              onChange={update("month")}
              invalid={Boolean(errorCode)}
              describedBy={describedBy}
            />
            <SelectField
              label="Año"
              name="bday-year"
              autoComplete="bday-year"
              placeholder="Año"
              options={yearOptions}
              value={parts.year}
              onChange={update("year")}
              invalid={Boolean(errorCode)}
              describedBy={describedBy}
            />
          </div>
          <div aria-live="polite" className="empty:hidden">
            {errorCode ? <FieldError id={errorId}>{ERROR_COPY[errorCode]}</FieldError> : null}
          </div>
          <p aria-live="polite" className="text-body font-bold text-success empty:hidden">
            {result.valid ? "Listo, ya puedes continuar." : null}
          </p>
        </fieldset>
        <SubmitButton>Continuar</SubmitButton>
        <p className="text-center text-caption text-text-muted">Esto es una demostración. No guardamos nada.</p>
      </form>
    </AuthShell>
  );
}
