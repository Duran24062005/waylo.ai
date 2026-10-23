import { z } from "zod";
import { isValidBirthDate } from "@/lib/birthdate";

// The messages are codes (keys of `server.errors` in the dictionaries): the route words them in the person's language.
export const registroSchema = z.object({
  nombre: z.string().trim().max(80, "nameLong").default(""),
  email: z.string().trim().toLowerCase().max(120, "emailFormat").regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "emailFormat"),
  password: z.string().min(8, "passwordShort").max(128, "passwordLong"),
  dia: z.number().int(),
  mes: z.number().int(),
  anio: z.number().int(),
  acepta: z.literal(true, { message: "consent" }),
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
