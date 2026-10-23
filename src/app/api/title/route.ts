import { NextResponse } from "next/server";
import { generateTitle } from "@/lib/title";

export const maxDuration = 15;

const MAX_CHARS = 500;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return NextResponse.json({ error: "Texto no válido." }, { status: 400 });
  }

  const title = await generateTitle(text);
  if (!title) return NextResponse.json({ error: "No pude generar el título." }, { status: 502 });
  return NextResponse.json({ title });
}
