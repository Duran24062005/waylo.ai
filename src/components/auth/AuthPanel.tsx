"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { LockPasswordIcon, Mail01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { buttonPrimary, buttonSoft } from "@/components/ui/buttons";
import { duration, easing } from "@/design/motion";
import { isValidBirthDate, type BirthDateError, type BirthDateInput } from "@/lib/birthdate";
import { cn } from "@/lib/utils";
import { AuthShell } from "./AuthShell";
import { FieldError } from "./FieldError";
import { PasswordToggle } from "./PasswordToggle";
import { BirthDatePicker } from "./BirthDatePicker";
import { StrengthMeter } from "./StrengthMeter";
import { TextField } from "./TextField";
import { focusRing } from "./styles";
import { validateLogin, validateRegistro } from "./validation";

export type AuthMode = "login" | "registro";

const COPY = {
  login: {
    title: "Bienvenido de nuevo",
    intro: "Entra para seguir con tu orientación.",
    action: "Entrar",
  },
  registro: {
    title: "Crea tu cuenta",
    intro: "Empieza en minutos. Solo te pedimos lo necesario.",
    action: "Crear mi cuenta",
  },
} as const;

const GOOGLE_ERROR = "No pudimos entrar con Google. Intenta de nuevo.";

const BIRTH_ERROR: Record<BirthDateError, string> = {
  incomplete: "Elige el día, el mes y el año.",
  invalid: "Esa fecha no existe. Revisa el día, el mes y el año.",
  future: "Esa fecha todavía no ha llegado. Revisa el año.",
  too_old: "Revisa el año. Debe ser de los últimos 120 años.",
};


const ease = [...easing.standard] as [number, number, number, number];

/** Extra fields grow in and out. Overflow is only clipped while the height animates, so focus halos stay visible. */
const reveal: Variants = {
  hidden: { height: 0, opacity: 0, y: -10, scale: 0.98, overflow: "hidden" },
  shown: {
    height: "auto",
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.slow, ease },
    transitionEnd: { overflow: "visible" },
  },
};

function Reveal({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <motion.div
      key={id}
      variants={reveal}
      initial="hidden"
      animate="shown"
      exit={{ height: 0, opacity: 0, y: -10, scale: 0.98, overflow: "hidden", transition: { duration: duration.base, ease } }}
    >
      {children}
    </motion.div>
  );
}

export function AuthPanel({ initialMode, googleError }: { initialMode: AuthMode; googleError?: boolean }) {
  const router = useRouter();
  const dateErrorId = useId();
  const consentErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [today] = useState(() => new Date());

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [acepta, setAcepta] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; acepta?: string }>({});
  const [formError, setFormError] = useState<string | null>(googleError ? GOOGLE_ERROR : null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRegistro = mode === "registro";
  const input: BirthDateInput = {
    day: birthDate ? birthDate.getDate() : null,
    month: birthDate ? birthDate.getMonth() + 1 : null,
    year: birthDate ? birthDate.getFullYear() : null,
  };
  const birth = isValidBirthDate(input, today);
  const birthError = isRegistro && !birth.valid && (submitted || Boolean(birthDate)) ? BIRTH_ERROR[birth.error] : null;

  function switchMode(next: AuthMode) {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setFormError(null);
    setSubmitted(false);
    window.history.replaceState(null, "", next === "login" ? "/login" : "/registro");
  }

  const clear = (field: "email" | "password" | "acepta") => {
    setFormError(null);
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const focusHandlers = { onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
  // While the password is focused the mascot looks away with its eyes closed.
  const passwordFocusHandlers = {
    onFocus: () => setPasswordFocused(true),
    onBlur: () => setPasswordFocused(false),
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = isRegistro ? validateRegistro({ nombre, email, password, acepta }) : validateLogin(email, password);
    flushSync(() => {
      setSubmitted(true);
      setErrors(found);
      setFormError(null);
    });

    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();
    if (isRegistro && (!birth.valid || (found as { acepta?: string }).acepta)) return;

    setSubmitting(true);
    try {
      const response = await fetch(isRegistro ? "/api/registro" : "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegistro
            ? { nombre, email, password, dia: input.day, mes: input.month, anio: input.year, acepta }
            : { email, password },
        ),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; campo?: string } | null;
        const message = body?.error ?? "No pudimos completar la acción. Intenta de nuevo.";
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
      : passwordFocused
        ? "private"
        : focused
          ? "listening"
          : isRegistro && birth.valid
            ? "success"
            : "idle";

  const copy = COPY[mode];

  return (
    <AuthShell mascotState={mascotState}>
      <motion.div
        initial={{ opacity: 0, y: 20, maxWidth: initialMode === "registro" ? 920 : 560 }}
        animate={{ opacity: 1, y: 0, maxWidth: isRegistro ? 920 : 560 }}
        transition={{ duration: duration.slow, ease }}
        className="w-full rounded-xl bg-surface-raised p-6 shadow-raised sm:p-8 short:p-5"
      >
        {/* Mode selector: the floating pill slides to the active option. */}
        <div
          role="tablist"
          aria-label="Acceso"
          className="relative mb-6 grid grid-cols-2 rounded-lg bg-surface p-1.5 shadow-inset short:mb-4"
        >
          {(["login", "registro"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => switchMode(tab)}
              className={cn(
                "relative h-11 rounded-md font-heading text-body font-semibold transition-colors duration-[var(--duration-base)] ease-standard short:h-10",
                focusRing,
                mode === tab ? "text-text" : "text-text-muted",
              )}
            >
              {mode === tab ? (
                <motion.span
                  layoutId="auth-pill"
                  transition={{ duration: duration.slow, ease }}
                  className="absolute inset-0 rounded-md bg-surface-raised shadow-soft"
                />
              ) : null}
              <span className="relative">{tab === "login" ? "Entrar" : "Crear cuenta"}</span>
            </button>
          ))}
        </div>

        <div className="mb-6 short:mb-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: duration.base, ease }}
              className="flex flex-col gap-1.5"
            >
              <h1 className="font-heading text-[clamp(1.75rem,3.8vh,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-text">
                {copy.title}
              </h1>
              <p className="text-base text-text-muted">{copy.intro}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} method="post" noValidate className="flex flex-col">
          <div className={cn("grid gap-x-8 gap-y-5 short:gap-y-3", isRegistro && "lg:grid-cols-2")}>
            <div className="flex flex-col gap-5 short:gap-3">
              <AnimatePresence initial={false}>
                {isRegistro ? (
                  <Reveal id="nombre">
                    <TextField
                      label="Nombre (opcional)"
                      name="nombre"
                      autoComplete="name"
                      leading={UserIcon}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      {...focusHandlers}
                    />
                  </Reveal>
                ) : null}
              </AnimatePresence>

              <TextField
                ref={emailRef}
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                leading={Mail01Icon}
                value={email}
                error={errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear("email");
                }}
                {...focusHandlers}
              />
              <TextField
                ref={passwordRef}
                label="Contraseña"
                name="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete={isRegistro ? "new-password" : "current-password"}
                leading={LockPasswordIcon}
                value={password}
                error={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear("password");
                }}
                trailing={(id) => (
                  <PasswordToggle
                    visible={passwordVisible}
                    onToggle={() => setPasswordVisible((v) => !v)}
                    controls={id}
                  />
                )}
                {...passwordFocusHandlers}
              />
              <AnimatePresence initial={false}>
                {isRegistro && passwordFocused ? (
                  <Reveal id="strength">
                    <StrengthMeter password={password} />
                  </Reveal>
                ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
              {isRegistro ? (
                <Reveal id="extras">
                  <div className="flex flex-col gap-5 short:gap-3">
                    <div className="flex flex-col gap-2">
                      <BirthDatePicker
                        value={birthDate}
                        onChange={setBirthDate}
                        today={today}
                        invalid={Boolean(birthError)}
                        describedBy={birthError ? dateErrorId : undefined}
                        onOpenChange={setFocused}
                      />
                      <div aria-live="polite" className="empty:hidden">
                        {birthError ? <FieldError id={dateErrorId}>{birthError}</FieldError> : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-text-muted">
                        <input
                          type="checkbox"
                          name="acepta"
                          checked={acepta}
                          onChange={(e) => {
                            setAcepta(e.target.checked);
                            clear("acepta");
                          }}
                          aria-invalid={errors.acepta ? true : undefined}
                          aria-describedby={errors.acepta ? consentErrorId : undefined}
                          className={`mt-px size-5 shrink-0 cursor-pointer accent-[var(--accent)] ${focusRing}`}
                        />
                        <span>Autorizo que Waylo guarde mis datos para crear mi cuenta. Solo se usan para eso.</span>
                      </label>
                      {errors.acepta ? <FieldError id={consentErrorId}>{errors.acepta}</FieldError> : null}
                    </div>
                  </div>
                </Reveal>
              ) : null}
            </AnimatePresence>
          </div>

          <div role="alert" className="empty:hidden pt-4">
            {formError ? <FieldError id="auth-error">{formError}</FieldError> : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
            className={cn(buttonPrimary, "mt-5 h-12 w-full overflow-hidden short:mt-3")}
          >
            <span className="relative grid">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={submitting ? "wait" : mode}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: duration.base, ease }}
                  className="col-start-1 row-start-1"
                >
                  {submitting ? "Un momento…" : copy.action}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </form>

        <div className="my-4 flex items-center gap-4 short:my-2" aria-hidden>
          <span className="h-px flex-1 bg-border-strong/40" />
          <span className="font-heading text-caption text-text-muted">o</span>
          <span className="h-px flex-1 bg-border-strong/40" />
        </div>

        {/* A full page navigation: the server starts the Google sign-in and brings the person back to the chat. */}
        <a href="/api/auth/google" className={cn(buttonSoft, "h-12 w-full gap-3")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.7 4.4-5.35 4.4a5.9 5.9 0 1 1 0-11.8c1.9 0 3.17.8 3.9 1.5l2.66-2.57C16.9 3.6 14.7 2.6 12 2.6a9.4 9.4 0 1 0 0 18.8c5.43 0 9-3.8 9-9.2 0-.62-.07-1.1-.15-1.1Z" />
          </svg>
          Continuar con Google
        </a>

        <p className="mt-4 text-center text-caption text-text-muted short:mt-2">
          Al continuar aceptas la{" "}
          <Link href="/privacidad" className={cn("link-anim rounded-sm font-semibold text-text", focusRing)}>
            Política de privacidad
          </Link>{" "}
          y los{" "}
          <Link href="/terminos" className={cn("link-anim rounded-sm font-semibold text-text", focusRing)}>
            Términos y condiciones
          </Link>
          .
        </p>
      </motion.div>
    </AuthShell>
  );
}
