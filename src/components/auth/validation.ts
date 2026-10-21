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

export interface RegistroErrors {
  nombre?: string;
  email?: string;
  password?: string;
  acepta?: string;
}

export function validateRegistro(values: {
  nombre: string;
  email: string;
  password: string;
  acepta: boolean;
}): RegistroErrors {
  const errors: RegistroErrors = {};
  if (values.nombre.trim().length < 2) errors.nombre = "Escribe tu nombre.";
  const email = values.email.trim();
  if (!email) errors.email = "Escribe tu correo.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Revisa tu correo. Debe verse así: nombre@correo.com";
  if (values.password.length < 8) errors.password = "Usa al menos 8 caracteres.";
  if (!values.acepta) errors.acepta = "Debes aceptar el uso de tus datos para crear la cuenta.";
  return errors;
}
