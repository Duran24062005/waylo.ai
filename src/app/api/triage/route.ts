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
import { getMessages } from "@/i18n/server";
import { isLocale } from "@/i18n/locales";
import { displayName } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { runTriage, TriageUnavailableError } from "@/lib/triage";
import type { ChatMessage } from "@/lib/types";
import { readUsage, saveUsage, usageStatus, withReply, type UsageRow } from "@/lib/usage";

// grok-4.6 reasons before answering and can take more than the 10 s default on Vercel.
export const maxDuration = 60;

export async function POST(request: Request) {
  const { locale: appLocale, t } = await getMessages();
  const body = (await request.json()) as {
    messages?: Pick<ChatMessage, "role" | "content">[];
    eps?: string;
    /** The reply the patient asked to have redone. */
    avoid?: unknown;
    /** The language the patient spoke in (a Live conversation). Otherwise the app's language is used. */
    lang?: unknown;
  };
  const locale = isLocale(body.lang) ? body.lang : appLocale;

  if (!body.messages?.length) {
    return NextResponse.json({ error: t.server.errors.missingMessage }, { status: 400 });
  }

  // Visitors get a few free replies, counted in a cookie the server signs. Once they are used up the visitor waits,
  // and the replies come back when the signed time passes. Signed-in accounts have a daily and a monthly allowance.
  const session = await getSession();
  const now = Date.now();
  let used = 0;
  let accountUsage: UsageRow | null = null;
  if (session) {
    accountUsage = await readUsage(session.id).catch(() => null);
    const status = usageStatus(accountUsage, now);
    if (status.blocked) return NextResponse.json({ error: "usage_limit", usage: status }, { status: 403 });
  } else {
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
      locale,
      name: session ? displayName(session) : undefined,
    });
    if (session) {
      // The fixed alarm text is not an AI reply, so it is not counted.
      if (result.kind === "red_flag") return NextResponse.json({ ...result, usage: usageStatus(accountUsage, now) });
      const next = withReply(accountUsage, now);
      // A failure to record the reply must not take the answer away from the patient.
      await saveUsage(session.id, next).catch(() => undefined);
      return NextResponse.json({ ...result, usage: usageStatus(next, now) });
    }

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
      return NextResponse.json({ error: t.server.errors.aiFailed }, { status: 502 });
    }
    throw error;
  }
}
