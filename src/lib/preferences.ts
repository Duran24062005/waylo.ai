import { isLocale, type Locale } from "@/i18n/locales";

export const VOICE_COOKIE = "waylo_voice";
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const VOICES = ["femenino", "masculino"] as const;
export type Voice = (typeof VOICES)[number];
export const DEFAULT_VOICE: Voice = "femenino";

/** The gateway's voice for each choice. Ara is the voice Waylo has always had. */
export const VOICE_IDS: Record<Voice, string> = { femenino: "ara", masculino: "rex" };

export function isVoice(value: unknown): value is Voice {
  return typeof value === "string" && (VOICES as readonly string[]).includes(value);
}

export interface Preferences {
  idioma: Locale;
  voz: Voice;
}

/** What a request's cookies say, with anything missing or edited by hand falling back to the default. */
export function readPreferences(get: (name: string) => string | undefined, locale: Locale): Preferences {
  const voice = get(VOICE_COOKIE);
  return {
    idioma: locale,
    voz: isVoice(voice) ? voice : DEFAULT_VOICE,
  };
}

export { isLocale };

/** The app language a recognizer or a voice tag names ("en", "pt-br", "es-MX"), or null when it is none of ours. */
export function languageOf(tag: unknown): Locale | null {
  if (typeof tag !== "string") return null;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

/** The gateway's voice for a choice. */
export function voiceIdFor(voice: Voice): string {
  return voice === "femenino" ? process.env.RETO_VOICE || VOICE_IDS.femenino : VOICE_IDS.masculino;
}
