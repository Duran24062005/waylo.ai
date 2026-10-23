import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getLocale } from "@/i18n/server";
import { getEpsState } from "@/lib/eps-db";
import { readPreferences } from "@/lib/preferences";
import { getProfile, listSessions } from "@/lib/profile-db";
import { getSession } from "@/lib/session";
import { readUsage, usageStatus } from "@/lib/usage";

/** What the settings window shows: the device's choices, and for a signed-in account its profile, sessions and usage. */
export async function GET() {
  const [locale, session, jar] = await Promise.all([getLocale(), getSession(), cookies()]);
  const preferences = readPreferences((name) => jar.get(name)?.value, locale);
  const common = { voice: preferences.voz };
  const headers = { "Cache-Control": "no-store" };

  if (!session) {
    return NextResponse.json({ signedIn: false, ...common, profile: null, sessions: [], usage: null, eps: null }, { headers });
  }

  try {
    const [profile, sessions, row, eps] = await Promise.all([
      getProfile(session.id),
      listSessions(session.id, session.sid),
      readUsage(session.id),
      getEpsState(session.id, Date.now()),
    ]);
    return NextResponse.json(
      { signedIn: true, ...common, profile, sessions, usage: usageStatus(row, Date.now()), eps },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500, headers });
  }
}
