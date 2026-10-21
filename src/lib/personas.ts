import { z } from "zod";
import { isValidBirthDate } from "@/lib/birthdate";

export const registroSchema = z.object({
  nombre: z.string().trim().max(80, "El nombre es muy largo.").default(""),
  email: z.string().trim().toLowerCase().max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Revisa tu correo."),
  password: z.string().min(8, "Usa al menos 8 caracteres.").max(128, "La contraseña es muy larga."),
  dia: z.number().int(),
  mes: z.number().int(),
  anio: z.number().int(),
  acepta: z.literal(true, { message: "Debes aceptar el uso de tus datos para crear la cuenta." }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(120),
  password: z.string().min(1).max(128),
});

export type RegistroInput = z.infer<typeof registroSchema>;

/** Returns an ISO date (YYYY-MM-DD) or null when the date is not valid today. */
export function toIsoBirthDate(input: Pick<RegistroInput, "dia" | "mes" | "anio">, today = new Date()): string | null {
  const result = isValidBirthDate({ day: input.dia, month: input.mes, year: input.anio }, today);
  if (!result.valid) return null;
  const pad = (n: number, size = 2) => String(n).padStart(size, "0");
  return `${pad(input.anio, 4)}-${pad(input.mes)}-${pad(input.dia)}`;
}
