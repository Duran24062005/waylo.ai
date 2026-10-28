import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getLocale } from "@/i18n/server";
import { getEpsState } from "@/lib/eps-db";
import { getIpsLink } from "@/lib/ips-backend";
import { readPreferences } from "@/lib/preferences";
import { getProfile, listSessions } from "@/lib/profile-db";
import { getSession } from "@/lib/session";
import { readUsage, usageStatus } from "@/lib/usage";
import { reportError } from "@/lib/error-report";

/** What the settings window shows: the device's choices, and for a signed-in account its profile, sessions and usage. */
export async function GET() {
  const [locale, session, jar] = await Promise.all([getLocale(), getSession(), cookies()]);
  const preferences = readPreferences((name) => jar.get(name)?.value, locale);
  const common = { voice: preferences.voz };
  const headers = { "Cache-Control": "no-store" };

  if (!session) {
    return NextResponse.json({ signedIn: false, ...common, profile: null, sessions: [], usage: null, eps: null, ips: { status: "none", ips: null, linked_at: null, status_changed_at: null } }, { headers });
  }

  try {
    const [profile, sessions, row, eps, ips] = await Promise.all([
      getProfile(session.id),
      listSessions(session.id, session.sid),
      readUsage(session.id),
      getEpsState(session.id, Date.now()),
      getIpsLink(session.id).catch(() => ({ status: "unavailable" as const, ips: null, linked_at: null, status_changed_at: null })),
    ]);
    return NextResponse.json(
      { signedIn: true, ...common, profile, sessions, usage: usageStatus(row, Date.now()), eps, ips },
      { headers },
    );
  } catch (error) {
    reportError("api/configuracion", error);
    return NextResponse.json({ error: "server" }, { status: 500, headers });
  }
}
