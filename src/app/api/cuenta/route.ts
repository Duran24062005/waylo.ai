import { NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { endSession, getSession } from "@/lib/session";
import { reportError } from "@/lib/error-report";

const schema = z.object({
  password: z.string().max(128).optional(),
  email: z.string().trim().toLowerCase().max(120).optional(),
});

/**
 * Deletes the signed-in account for good: the person, their sessions and their usage go with it.
 * It asks again who is asking, since a session left open on another device must not be enough to erase an account:
 * the password for accounts that have one, and for accounts made with Google, the address of the account.
 * Answers carry a code, which the settings window words in the person's language.
 */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const sql = getSql();
    const rows = (await sql`select email, password_hash from personas where id = ${session.id}`) as {
      email: string;
      password_hash: string | null;
    }[];
    const account = rows[0];
    if (!account) return NextResponse.json({ error: "auth" }, { status: 401 });

    if (account.password_hash) {
      const password = parsed.data.password ?? "";
      if (!password || !(await verifyPassword(password, account.password_hash))) {
        return NextResponse.json({ error: "wrong_password" }, { status: 401 });
      }
    } else if ((parsed.data.email ?? "") !== account.email.toLowerCase()) {
      return NextResponse.json({ error: "mismatch" }, { status: 400 });
    }

    // The sessions and the usage go with the account (they are tied to it with ON DELETE CASCADE).
    await sql`delete from personas where id = ${session.id}`;
    await endSession();
    return NextResponse.json({ ok: true, id: session.id });
  } catch (error) {
    reportError("api/cuenta", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
