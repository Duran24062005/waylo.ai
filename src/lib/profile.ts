import { z } from "zod";
import { isColombianCity } from "@/data/ciudades";
import { isCountryCode } from "@/data/paises";

// Two options, drawn as icons in the settings. The column keeps its old name.
export const SEXES = ["masculino", "femenino"] as const;
export type Sex = (typeof SEXES)[number];

export const NAME_MAX = 80;
export const NICKNAME_MAX = 30;

// Letters of any language, accents, and the few marks names use. Nothing here can carry an instruction to the AI,
// because the nickname is written into its prompt.
const NAME_CHARS = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u;

const optionalText = <T extends z.ZodType<string>>(schema: T) =>
  z.union([schema, z.literal("").transform(() => null), z.null()]);

/** Each field can be sent on its own: the settings page saves one field at a time. */
export const profileSchema = z
  .object({
    nombre: z.string().trim().min(1).max(NAME_MAX).regex(NAME_CHARS),
    apodo: optionalText(z.string().trim().max(NICKNAME_MAX).regex(NAME_CHARS)),
    sexo: z.union([z.enum(SEXES), z.null()]),
    ciudad: z.union([z.string().refine(isColombianCity), z.null()]),
    nacionalidad: z.union([z.string().refine(isCountryCode), z.null()]),
  })
  .partial()
  .strict();

export type ProfilePatch = z.infer<typeof profileSchema>;

export const emailChangeSchema = z.object({
  email: z.string().trim().toLowerCase().max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  password: z.string().min(1).max(128),
});

/** What the settings page shows of an account. */
export interface Profile {
  nombre: string;
  apodo: string | null;
  email: string;
  sexo: Sex | null;
  ciudad: string | null;
  nacionalidad: string | null;
  /** Accounts made with Google have no password here, so their email is Google's and is not changed from this app. */
  tienePassword: boolean;
}

/** What the AI is told to call the person: the nickname if there is one, else the first name. */
export function displayName(user: { nombre: string; apodo?: string | null }): string {
  return user.apodo?.trim() || user.nombre.trim().split(/\s+/)[0] || "";
}
