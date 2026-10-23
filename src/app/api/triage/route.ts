import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decodeGuestCount,
  encodeGuestCount,
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE,
  guestLimitReached,
  guestUsage,
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
  };

  if (!body.messages?.length) {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  // Signed-in users have no limit. Visitors get a few free replies, counted in a cookie the server signs.
  const session = await getSession();
  let used = 0;
  if (!session) {
    used = decodeGuestCount((await cookies()).get(GUEST_COOKIE)?.value);
    if (guestLimitReached(used)) {
      return NextResponse.json({ error: "guest_limit", guest: guestUsage(used) }, { status: 403 });
    }
  }

  try {
    const result = await runTriage({
      messages: body.messages.slice(-12),
      eps: body.eps,
    });
    if (session) return NextResponse.json(result);

    // The fixed alarm text is not an AI reply, so it never uses up the free replies.
    const counted = result.kind === "red_flag" ? used : used + 1;
    const response = NextResponse.json({ ...result, guest: guestUsage(counted) });
    if (counted !== used) {
      response.cookies.set(GUEST_COOKIE, encodeGuestCount(counted), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: GUEST_COOKIE_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof TriageUnavailableError) {
      // A failed reply is not charged.
      return NextResponse.json({ error: "La IA no pudo responder." }, { status: 502 });
    }
    throw error;
  }
}
