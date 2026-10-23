import { NextResponse } from "next/server";
import { getMessages } from "@/i18n/server";
import { generateTitle } from "@/lib/title";

export const maxDuration = 15;

const MAX_CHARS = 500;

export async function POST(request: Request) {
  const { t } = await getMessages();
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return NextResponse.json({ error: t.server.errors.invalidText }, { status: 400 });
  }

  const title = await generateTitle(text);
  if (!title) return NextResponse.json({ error: t.server.errors.titleFailed }, { status: 502 });
  return NextResponse.json({ title });
}
