import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  afterReply,
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE,
  guestLimitReached,
  guestUsage,
  readGuest,
} from "@/lib/guest";
import { getSession } from "@/lib/session";
import { runTriage, TriageUnavailableError } from "@/lib/triage";
import type { ChatMessage } from "@/lib/types";

// grok-4.6 reasons before answering and can take more than the 10 s default on Vercel.
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    messages?: Pick<ChatMessage, "role" | "content">[];
    eps?: string;
    /** The reply the patient asked to have redone. */
    avoid?: unknown;
  };

  if (!body.messages?.length) {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  // Signed-in users have no limit. Visitors get a few free replies, counted in a cookie the server signs.
  // Once they are used up the visitor waits, and the replies come back when the signed time passes.
  const session = await getSession();
  const now = Date.now();
  let used = 0;
  if (!session) {
    const state = readGuest((await cookies()).get(GUEST_COOKIE)?.value, now);
    used = state.used;
    if (guestLimitReached(used)) {
      return NextResponse.json({ error: "guest_limit", guest: guestUsage(state) }, { status: 403 });
    }
  }

  try {
    const result = await runTriage({
      messages: body.messages.slice(-12),
      eps: body.eps,
      avoid: typeof body.avoid === "string" ? body.avoid : undefined,
    });
    if (session) return NextResponse.json(result);

    // The fixed alarm text is not an AI reply, so it never uses up the free replies.
    if (result.kind === "red_flag") {
      return NextResponse.json({ ...result, guest: guestUsage({ used }) });
    }
    const { cookie, ...state } = afterReply(used, now);
    const response = NextResponse.json({ ...result, guest: guestUsage(state) });
    response.cookies.set(GUEST_COOKIE, cookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof TriageUnavailableError) {
      // A failed reply is not charged.
      return NextResponse.json({ error: "La IA no pudo responder." }, { status: 502 });
    }
    throw error;
  }
}
