import { NextResponse } from "next/server";
import { getMessages } from "@/i18n/server";
import { sendFeedbackToDiscord } from "@/lib/discord";
import { getSession } from "@/lib/session";

export const maxDuration = 15;

const MAX_ID_CHARS = 80;
/** Votes one visitor can send per minute. The count lives in this instance only, which is enough to stop a script flooding the channel. */
const MAX_PER_MINUTE = 20;
const WINDOW_MS = 60 * 1000;

const recent = new Map<string, number[]>();

function tooMany(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= MAX_PER_MINUTE) {
    recent.set(key, hits);
    return true;
  }
  recent.set(key, [...hits, now]);
  // Keeps the map from growing with every address that ever voted.
  if (recent.size > 1000) {
    for (const [other, times] of recent) if (times.every((at) => now - at >= WINDOW_MS)) recent.delete(other);
  }
  return false;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { vote?: unknown; messageId?: unknown } | null;
  const vote = body?.vote;
  const messageId = typeof body?.messageId === "string" ? body.messageId.trim() : "";
  if ((vote !== "like" && vote !== "dislike") || !messageId || messageId.length > MAX_ID_CHARS) {
    return NextResponse.json({ error: "invalid_feedback" }, { status: 400 });
  }

  const now = Date.now();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (tooMany(forwarded || "unknown", now)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const [{ locale }, session] = await Promise.all([getMessages(), getSession()]);
  const sent = await sendFeedbackToDiscord({ vote, messageId, locale, signedIn: Boolean(session), at: now });
  // The person's vote never fails because of Discord: they only see it marked.
  return NextResponse.json({ ok: true, delivered: sent });
}
