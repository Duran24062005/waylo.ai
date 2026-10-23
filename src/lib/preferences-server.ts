import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { isLocale, LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Locale } from "@/i18n/locales";
import {
  isLiveLanguage,
  isVoice,
  LIVE_LANG_COOKIE,
  PREFERENCE_COOKIE_MAX_AGE,
  VOICE_COOKIE,
  type LiveLanguage,
  type Voice,
} from "@/lib/preferences";

const cookieOptions = (maxAge: number) => ({
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/** Remembers choices on this device. Visitors without an account keep them only here. */
export async function setPreferenceCookies(next: { idioma?: Locale; voz?: Voice; idiomaLive?: LiveLanguage }) {
  const jar = await cookies();
  if (next.idioma) jar.set(LANG_COOKIE, next.idioma, cookieOptions(LANG_COOKIE_MAX_AGE));
  if (next.voz) jar.set(VOICE_COOKIE, next.voz, cookieOptions(PREFERENCE_COOKIE_MAX_AGE));
  if (next.idiomaLive) jar.set(LIVE_LANG_COOKIE, next.idiomaLive, cookieOptions(PREFERENCE_COOKIE_MAX_AGE));
}

/** What an account has saved, with anything unset or not valid left out. */
export interface SavedPreferences {
  idioma: string | null;
  voz: string | null;
  idioma_live: string | null;
}

/** After signing in, the account's saved choices take over this device's, so settings follow the person. */
export async function applyAccountPreferences(saved: SavedPreferences) {
  await setPreferenceCookies({
    idioma: isLocale(saved.idioma) ? saved.idioma : undefined,
    voz: isVoice(saved.voz) ? saved.voz : undefined,
    idiomaLive: isLiveLanguage(saved.idioma_live) ? saved.idioma_live : undefined,
  });
}

/** Saves this device's choices on an account (used when a visitor who set them creates one). */
export async function saveDevicePreferences(personaId: string) {
  const jar = await cookies();
  const idioma = jar.get(LANG_COOKIE)?.value;
  const voz = jar.get(VOICE_COOKIE)?.value;
  const live = jar.get(LIVE_LANG_COOKIE)?.value;
  await getSql()`
    update personas set
      idioma = ${isLocale(idioma) ? idioma : null},
      voz = ${isVoice(voz) ? voz : null},
      idioma_live = ${isLiveLanguage(live) ? live : null}
    where id = ${personaId}
  `;
}
