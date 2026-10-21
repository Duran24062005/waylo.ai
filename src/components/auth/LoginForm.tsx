"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AuthShell } from "./AuthShell";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Visual prototype: no real authentication, no network call, nothing is stored.
    const data = new FormData(event.currentTarget);
    const nextErrors = validateLogin(String(data.get("email") ?? ""), String(data.get("password") ?? ""));

    // Flush so the error text exists before focus moves; screen readers then read it.
    flushSync(() => setErrors(nextErrors));

    if (nextErrors.email) {
      emailRef.current?.focus();
    } else if (nextErrors.password) {
      passwordRef.current?.focus();
    } else {
      router.push("/chat");
    }
  }

  const clearError = (field: keyof LoginErrors) => () =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const focusHandlers = {
    onFocus: () => setFieldFocused(true),
    onBlur: () => setFieldFocused(false),
  };

  return (
    <AuthShell
      title="Entra a tu cuenta"
      intro="Escribe tu correo y tu contraseña."
      mascotState={fieldFocused ? "listening" : "idle"}
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className={`inline-flex min-h-11 items-center rounded-sm px-1 font-bold text-accent underline underline-offset-4 ${focusRing}`}
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
        <SubmitButton>Entrar</SubmitButton>
        <p className="text-center text-caption text-text-muted">
          Esto es una demostración. No revisamos ni guardamos nada.
        </p>
      </form>
    </AuthShell>
  );
}
