import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LANG_COOKIE,
  matchLocale,
  type LanguageChoice,
  type Locale,
} from "@/i18n/locales";
import { messages, type Messages } from "@/i18n/messages";

/**
 * The language for this request: the one the person chose (a cookie), else the best match for their browser,
 * else Spanish. Pages that call this are rendered per request, since the answer differs from person to person.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  try {
    const chosen = (await cookies()).get(LANG_COOKIE)?.value;
    if (isLocale(chosen)) return chosen;
    return matchLocale((await headers()).get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
});

/** What the person chose: a language, or "auto" when they have not fixed one and the app follows their browser. */
export const getLanguageChoice = cache(async (): Promise<LanguageChoice> => {
  try {
    const chosen = (await cookies()).get(LANG_COOKIE)?.value;
    return isLocale(chosen) ? chosen : "auto";
  } catch {
    return "auto";
  }
});

/** The texts of this request's language. */
export async function getMessages(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await getLocale();
  return { locale, t: messages[locale] };
}
