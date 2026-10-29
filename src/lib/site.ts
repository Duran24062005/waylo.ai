import type { Locale } from "@/i18n/locales";

/** The public address of the site, with no trailing slash. Canonical links, the sitemap and social previews all start from it. */
export const SITE_URL = (process.env.SITE_URL ?? "https://waylo-ai.vercel.app").replace(/\/+$/, "");

/** The language tag Open Graph expects for each language of the app. */
export const OG_LOCALES: Record<Locale, string> = { es: "es_CO", en: "en_US", pt: "pt_BR" };

/** The pages a search engine may list: public, with the same content for everyone. */
export const INDEXABLE_PATHS = ["/", "/chat", "/privacidad", "/terminos"] as const;
