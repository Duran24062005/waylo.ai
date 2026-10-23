import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { emailChangeSchema } from "@/lib/profile";
import { getSession } from "@/lib/session";

/** Changing the email asks for the current password, so a session left open somewhere cannot take the account over. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const parsed = emailChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", campo: "email" }, { status: 400 });

  try {
    const sql = getSql();
    const rows = (await sql`select password_hash from personas where id = ${session.id}`) as {
      password_hash: string | null;
    }[];
    const hash = rows[0]?.password_hash;
    // Accounts made with Google have no password here; their email belongs to Google.
    if (!hash) return NextResponse.json({ error: "no_password" }, { status: 403 });
    if (!(await verifyPassword(parsed.data.password, hash))) {
      return NextResponse.json({ error: "wrong_password", campo: "password" }, { status: 401 });
    }

    await sql`update personas set email = ${parsed.data.email} where id = ${session.id}`;
    return NextResponse.json({ ok: true, email: parsed.data.email });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "email_taken", campo: "email" }, { status: 409 });
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
