import { NextResponse } from "next/server";
import { getMessages } from "@/i18n/server";
import { getSql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registroSchema, toIsoBirthDate } from "@/lib/personas";
import { saveDevicePreferences } from "@/lib/preferences-server";
import { startSession } from "@/lib/session";
import { reportError } from "@/lib/error-report";

export async function POST(request: Request) {
  const { t } = await getMessages();
  const errors = t.server.errors;

  const body = await request.json().catch(() => null);
  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // The schema's messages are codes; anything else (a malformed body) gets the general one.
    const known = (issue?.message ?? "") in errors;
    return NextResponse.json(
      { error: known ? errors[issue.message as keyof typeof errors] : errors.review, campo: issue?.path[0] },
      { status: 400 },
    );
  }

  const nacimiento = toIsoBirthDate(parsed.data);
  if (!nacimiento) {
    return NextResponse.json({ error: errors.birthDate, campo: "fecha" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const hash = await hashPassword(parsed.data.password);
    const rows = (await sql`
      insert into personas (nombre, email, password_hash, fecha_nacimiento, acepta_datos_en)
      values (${parsed.data.nombre || parsed.data.email.split("@")[0]}, ${parsed.data.email}, ${hash}, ${nacimiento}, now())
      returning id, nombre
    `) as { id: string; nombre: string }[];
    await saveDevicePreferences(rows[0].id);
    await startSession(rows[0].id);
    return NextResponse.json({ ok: true, nombre: rows[0].nombre }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: errors.emailTaken, campo: "email" }, { status: 409 });
    }
    reportError("api/registro", error);
    return NextResponse.json({ error: errors.signupFailed }, { status: 500 });
  }
}
