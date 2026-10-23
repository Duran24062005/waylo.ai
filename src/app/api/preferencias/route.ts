import { NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { LIVE_LANGUAGES, VOICES } from "@/lib/preferences";
import { setPreferenceCookies } from "@/lib/preferences-server";
import { getSession } from "@/lib/session";
import { LOCALES } from "@/i18n/locales";

const schema = z
  .object({
    idioma: z.enum(LOCALES),
    voz: z.enum(VOICES),
    idiomaLive: z.enum(LIVE_LANGUAGES),
  })
  .partial()
  .strict();

/**
 * Language, Waylo's voice and the Live language. They are kept in cookies on this device, which is where the
 * server reads them for every page and reply, and also on the account, so they follow the person to another device.
 */
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await setPreferenceCookies(parsed.data);

  const session = await getSession();
  if (session) {
    try {
      const sql = getSql();
      const { idioma, voz, idiomaLive } = parsed.data;
      if (idioma) await sql`update personas set idioma = ${idioma} where id = ${session.id}`;
      if (voz) await sql`update personas set voz = ${voz} where id = ${session.id}`;
      if (idiomaLive) await sql`update personas set idioma_live = ${idiomaLive} where id = ${session.id}`;
    } catch {
      // The choice already applies on this device; saving it on the account is retried on the next change.
      return NextResponse.json({ ok: true, saved: false });
    }
  }
  return NextResponse.json({ ok: true, saved: Boolean(session) });
}
