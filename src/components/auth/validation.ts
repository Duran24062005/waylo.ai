// Format check only: it catches typos, it does not prove the address exists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface LoginErrors {
  email?: string;
  password?: string;
}

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const trimmed = email.trim();

  if (!trimmed) {
    errors.email = "Escribe tu correo.";
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    errors.email = "Revisa tu correo. Debe verse así: nombre@correo.com";
  }

  if (!password) {
    errors.password = "Escribe tu contraseña.";
  }

  return errors;
}
