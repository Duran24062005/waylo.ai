import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/personas";
import { startSession } from "@/lib/session";

// Same hash shape as a real one, so a missing account takes about as long as a wrong password.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";
const INVALID = { error: "Correo o contraseña incorrectos." };

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(INVALID, { status: 401 });

  try {
    const sql = getSql();
    const rows = (await sql`
      select id, nombre, password_hash from personas where lower(email) = ${parsed.data.email} limit 1
    `) as { id: string; nombre: string; password_hash: string }[];
    const person = rows[0];
    const ok = await verifyPassword(parsed.data.password, person?.password_hash ?? DUMMY_HASH);
    if (!person || !ok) return NextResponse.json(INVALID, { status: 401 });

    await startSession({ id: person.id, nombre: person.nombre });
    return NextResponse.json({ ok: true, nombre: person.nombre });
  } catch {
    return NextResponse.json({ error: "No pudimos iniciar sesión. Intenta de nuevo." }, { status: 500 });
  }
}
