// Format check only: it catches typos, it does not prove the address exists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The messages a form can show, in the person's language. The screen passes `t.auth.errors`. */
export interface ValidationMessages {
  emailMissing: string;
  emailFormat: string;
  passwordMissing: string;
  passwordShort: string;
  consentMissing: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export function validateLogin(email: string, password: string, messages: ValidationMessages): LoginErrors {
  const errors: LoginErrors = {};
  const trimmed = email.trim();

  if (!trimmed) {
    errors.email = messages.emailMissing;
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    errors.email = messages.emailFormat;
  }

  if (!password) {
    errors.password = messages.passwordMissing;
  }

  return errors;
}

export interface RegistroErrors {
  nombre?: string;
  email?: string;
  password?: string;
  acepta?: string;
}

export function validateRegistro(
  values: {
    nombre: string;
    email: string;
    password: string;
    acepta: boolean;
  },
  messages: ValidationMessages,
): RegistroErrors {
  const errors: RegistroErrors = {};
  const email = values.email.trim();
  if (!email) errors.email = messages.emailMissing;
  else if (!EMAIL_PATTERN.test(email)) errors.email = messages.emailFormat;
  if (values.password.length < 8) errors.password = messages.passwordShort;
  if (!values.acepta) errors.acepta = messages.consentMissing;
  return errors;
}
