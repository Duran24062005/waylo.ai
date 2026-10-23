import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMessages } from "@/i18n/server";
import { isLocale, SPEECH_LANGUAGE } from "@/i18n/locales";
import { gatewayConfig } from "@/lib/gateway";
import { DEFAULT_VOICE, isVoice, VOICE_COOKIE, voiceIdFor } from "@/lib/preferences";

export const maxDuration = 30;

// One spoken chunk. The client splits longer replies into sentences.
const MAX_CHARS = 600;

export async function POST(request: Request) {
  const { locale, t } = await getMessages();
  const body = (await request.json().catch(() => null)) as { text?: unknown; lang?: unknown; voice?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return NextResponse.json({ error: t.server.errors.invalidText }, { status: 400 });
  }

  const gateway = gatewayConfig();
  if (!gateway) {
    console.error("[voice] RETO_KEY is not set");
    return NextResponse.json({ error: t.server.errors.voiceUnavailable }, { status: 503 });
  }

  // The reply's language, when the client knows it (a Live conversation in another language); else the app's.
  const language = isLocale(body?.lang) ? body.lang : locale;
  // The voice the person chose in the settings. The body can name one to preview it before it is saved.
  const saved = (await cookies()).get(VOICE_COOKIE)?.value;
  const voice = isVoice(body?.voice) ? body.voice : isVoice(saved) ? saved : DEFAULT_VOICE;

  const upstream = await fetch(`${gateway.baseUrl}/tts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gateway.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: voiceIdFor(voice), language: SPEECH_LANGUAGE[language] }),
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    console.error("[voice] speech request failed:", upstream?.status ?? "sin respuesta");
    return NextResponse.json({ error: t.server.errors.voiceFailed }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: { "Content-Type": upstream.headers.get("content-type") || "audio/mpeg", "Cache-Control": "no-store" },
  });
}
