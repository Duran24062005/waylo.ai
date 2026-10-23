import { NextResponse } from "next/server";
import { epsPatchSchema } from "@/lib/eps";
import { saveEps } from "@/lib/eps-db";
import { getSession } from "@/lib/session";

/**
 * Saves the EPS settings: the insurer, the ID number, the temporary code and the authorization. Each can come alone.
 * The ID number and the code are stored encrypted, and the answer never carries them back: only the ID number masked.
 * Answers carry a code, which the settings window words in the person's language.
 */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const parsed = epsPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", campo: parsed.error.issues[0]?.path[0] }, { status: 400 });
  }

  try {
    const result = await saveEps(session.id, parsed.data, Date.now());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ ok: true, eps: result.state });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
