import { NextResponse } from "next/server";
import { closeSession } from "@/lib/profile-db";
import { getSession } from "@/lib/session";

/** Closes one of the account's other sessions. This device signs out through /api/logout. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await params;
  if (id === session.sid) return NextResponse.json({ error: "current" }, { status: 400 });
  // Only a well-formed id reaches the database.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const closed = await closeSession(session.id, id);
    return NextResponse.json(closed ? { ok: true } : { error: "not_found" }, { status: closed ? 200 : 404 });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
