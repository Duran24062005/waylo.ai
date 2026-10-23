import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/profile";
import { updateProfile } from "@/lib/profile-db";
import { getSession } from "@/lib/session";

// Answers carry a code, not a sentence: the page words each one in the person's language.
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", campo: parsed.error.issues[0]?.path[0] }, { status: 400 });
  }

  try {
    await updateProfile(session.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
