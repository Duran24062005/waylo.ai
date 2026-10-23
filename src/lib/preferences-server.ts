import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import {
  isLanguageChoice,
  isLocale,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  type LanguageChoice,
} from "@/i18n/locales";
import { isVoice, PREFERENCE_COOKIE_MAX_AGE, VOICE_COOKIE, type Voice } from "@/lib/preferences";

const cookieOptions = (maxAge: number) => ({
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/**
 * Remembers choices on this device. Visitors without an account keep them only here.
 * "auto" is the absence of a language cookie: the app then follows the browser.
 */
export async function setPreferenceCookies(next: { idioma?: LanguageChoice; voz?: Voice }) {
  const jar = await cookies();
  if (next.idioma === "auto") jar.set(LANG_COOKIE, "", cookieOptions(0));
  else if (next.idioma) jar.set(LANG_COOKIE, next.idioma, cookieOptions(LANG_COOKIE_MAX_AGE));
  if (next.voz) jar.set(VOICE_COOKIE, next.voz, cookieOptions(PREFERENCE_COOKIE_MAX_AGE));
}

/** What an account has saved, with anything unset or not valid left out. */
export interface SavedPreferences {
  idioma: string | null;
  voz: string | null;
}

/** After signing in, the account's saved choices take over this device's, so settings follow the person. */
export async function applyAccountPreferences(saved: SavedPreferences) {
  await setPreferenceCookies({
    idioma: isLanguageChoice(saved.idioma) ? saved.idioma : undefined,
    voz: isVoice(saved.voz) ? saved.voz : undefined,
  });
}

/** Saves this device's choices on an account (used when a visitor who set them creates one). */
export async function saveDevicePreferences(personaId: string) {
  const jar = await cookies();
  const idioma = jar.get(LANG_COOKIE)?.value;
  const voz = jar.get(VOICE_COOKIE)?.value;
  await getSql()`
    update personas set
      idioma = ${isLocale(idioma) ? idioma : "auto"},
      voz = ${isVoice(voz) ? voz : null}
    where id = ${personaId}
  `;
}
