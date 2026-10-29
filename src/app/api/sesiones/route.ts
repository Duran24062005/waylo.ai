import { NextResponse } from "next/server";
import { closeOtherSessions } from "@/lib/profile-db";
import { getSession } from "@/lib/session";
import { reportError } from "@/lib/error-report";

/** Closes every session of the account except this device's. */
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, closed: await closeOtherSessions(session.id, session.sid) });
  } catch (error) {
    reportError("api/sesiones", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
