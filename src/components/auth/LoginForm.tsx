"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AuthShell } from "./AuthShell";
import { FieldError } from "./FieldError";
import { PasswordToggle } from "./PasswordToggle";
import { SubmitButton } from "./SubmitButton";
import { TextField } from "./TextField";
import { focusRing } from "./styles";
import { validateLogin, type LoginErrors } from "./validation";

export function LoginForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const nextErrors = validateLogin(email, password);

    // Flush so the error text exists before focus moves; screen readers then read it.
    flushSync(() => {
      setErrors(nextErrors);
      setFormError(null);
    });

    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setFormError(body?.error ?? "No pudimos iniciar sesión. Intenta de nuevo.");
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

  const clearError = (field: keyof LoginErrors) => () => {
    setFormError(null);
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const focusHandlers = {
    onFocus: () => setFieldFocused(true),
    onBlur: () => setFieldFocused(false),
  };

  const mascotState = submitting ? "thinking" : formError ? "error" : fieldFocused ? "listening" : "idle";

  return (
    <AuthShell
      title="Entra a tu cuenta"
      intro="Escribe tu correo y tu contraseña."
      mascotState={mascotState}
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className={`inline-flex min-h-11 items-center rounded-sm px-1 font-heading font-semibold text-accent underline underline-offset-4 ${focusRing}`}
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} method="post" noValidate className="flex flex-col gap-6">
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
          autoComplete="current-password"
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
        <div role="alert" className="empty:hidden">
          {formError ? <FieldError id="login-error">{formError}</FieldError> : null}
        </div>
        <SubmitButton loading={submitting}>Entrar</SubmitButton>
      </form>
    </AuthShell>
  );
}
