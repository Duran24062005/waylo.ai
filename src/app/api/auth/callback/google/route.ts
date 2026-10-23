import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { googleConfig, OAUTH_STATE_COOKIE } from "@/lib/google";
import { applyAccountPreferences, saveDevicePreferences, type SavedPreferences } from "@/lib/preferences-server";
import { startSession } from "@/lib/session";

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  aud: string;
}

export async function GET(request: Request) {
  const fail = () => NextResponse.redirect(new URL("/login?error=google", request.url));
  const config = googleConfig(request);
  if (!config) return fail();

  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((part) => part.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];
  if (!code || !state || !cookieState || state !== cookieState) return fail();

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) return fail();
    const { id_token: idToken } = (await tokenResponse.json()) as { id_token?: string };
    if (!idToken) return fail();

    // Google validates the signature and expiry of the token for us.
    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!profileResponse.ok) return fail();
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (profile.aud !== config.clientId || String(profile.email_verified) !== "true" || !profile.email) return fail();

    const email = profile.email.toLowerCase();
    const nombre = (profile.name ?? "").trim() || email.split("@")[0];
    const sql = getSql();

    const found = (await sql`
      select id, nombre, idioma, voz from personas where google_id = ${profile.sub} or lower(email) = ${email} limit 1
    `) as ({ id: string; nombre: string } & SavedPreferences)[];

    let person: { id: string; nombre: string };
    if (found[0]) {
      person = found[0];
      await sql`update personas set google_id = ${profile.sub} where id = ${person.id} and google_id is null`;
      await applyAccountPreferences(found[0]);
    } else {
      // Continuing with Google accepts the privacy notice shown on the access screen.
      const created = (await sql`
        insert into personas (nombre, email, google_id, acepta_datos_en)
        values (${nombre}, ${email}, ${profile.sub}, now())
        returning id, nombre
      `) as { id: string; nombre: string }[];
      person = created[0];
      await saveDevicePreferences(person.id);
    }

    await startSession(person.id);
    const response = NextResponse.redirect(new URL("/chat", request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch {
    return fail();
  }
}
