import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registroSchema, toIsoBirthDate } from "@/lib/personas";
import { startSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Revisa los datos.", campo: issue?.path[0] }, { status: 400 });
  }

  const nacimiento = toIsoBirthDate(parsed.data);
  if (!nacimiento) {
    return NextResponse.json({ error: "Revisa la fecha de nacimiento.", campo: "fecha" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const hash = await hashPassword(parsed.data.password);
    const rows = (await sql`
      insert into personas (nombre, email, password_hash, fecha_nacimiento, acepta_datos_en)
      values (${parsed.data.nombre || parsed.data.email.split("@")[0]}, ${parsed.data.email}, ${hash}, ${nacimiento}, now())
      returning id, nombre
    `) as { id: string; nombre: string }[];
    await startSession({ id: rows[0].id, nombre: rows[0].nombre });
    return NextResponse.json({ ok: true, nombre: rows[0].nombre }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo.", campo: "email" }, { status: 409 });
    }
    return NextResponse.json({ error: "No pudimos crear la cuenta. Intenta de nuevo." }, { status: 500 });
  }
}
