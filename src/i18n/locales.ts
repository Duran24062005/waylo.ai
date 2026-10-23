export const LOCALES = ["es", "en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";
export const LANG_COOKIE = "waylo_lang";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The best supported language for an Accept-Language header, or the default. Used on a first visit, before a choice is made. */
export function matchLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((item) => item.base && Number.isFinite(item.q) && item.q > 0)
    .sort((a, b) => b.q - a.q);
  return wanted.map((item) => item.base).find(isLocale) ?? DEFAULT_LOCALE;
}

/** The language tag speech uses for each app language. */
export const SPEECH_LANGUAGE: Record<Locale, string> = { es: "es-MX", en: "en", pt: "pt-BR" };

/** The regional variant used to format dates and numbers in each language. */
export const FORMAT_LOCALE: Record<Locale, string> = { es: "es-CO", en: "en-US", pt: "pt-BR" };

/** The name of each language in itself, which is how a language picker shows them. */
export const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English", pt: "Português" };
export const LOCALE_CODES: Record<Locale, string> = { es: "ES", en: "EN", pt: "PT" };
