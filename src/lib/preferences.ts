import { isLocale, type Locale } from "@/i18n/locales";

export const VOICE_COOKIE = "waylo_voice";
export const LIVE_LANG_COOKIE = "waylo_live_lang";
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const VOICES = ["femenino", "masculino"] as const;
export type Voice = (typeof VOICES)[number];
export const DEFAULT_VOICE: Voice = "femenino";

/** The gateway's voice for each choice. Ara is the voice Waylo has always had. */
export const VOICE_IDS: Record<Voice, string> = { femenino: "ara", masculino: "rex" };

/** "auto" lets the speech recognizer work out the language; the others fix it. */
export const LIVE_LANGUAGES = ["auto", "en", "es", "pt"] as const;
export type LiveLanguage = (typeof LIVE_LANGUAGES)[number];
export const DEFAULT_LIVE_LANGUAGE: LiveLanguage = "auto";

export function isVoice(value: unknown): value is Voice {
  return typeof value === "string" && (VOICES as readonly string[]).includes(value);
}

export function isLiveLanguage(value: unknown): value is LiveLanguage {
  return typeof value === "string" && (LIVE_LANGUAGES as readonly string[]).includes(value);
}

export interface Preferences {
  idioma: Locale;
  voz: Voice;
  idiomaLive: LiveLanguage;
}

/** What a request's cookies say, with anything missing or edited by hand falling back to the default. */
export function readPreferences(get: (name: string) => string | undefined, locale: Locale): Preferences {
  const voice = get(VOICE_COOKIE);
  const live = get(LIVE_LANG_COOKIE);
  return {
    idioma: locale,
    voz: isVoice(voice) ? voice : DEFAULT_VOICE,
    idiomaLive: isLiveLanguage(live) ? live : DEFAULT_LIVE_LANGUAGE,
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
