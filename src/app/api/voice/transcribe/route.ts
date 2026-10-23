import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMessages } from "@/i18n/server";
import { gatewayConfig } from "@/lib/gateway";
import { DEFAULT_LIVE_LANGUAGE, isLiveLanguage, LIVE_LANG_COOKIE, languageOf } from "@/lib/preferences";

export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const { t } = await getMessages();
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return NextResponse.json({ error: t.server.errors.audioInvalid }, { status: 400 });
  }

  const gateway = gatewayConfig();
  if (!gateway) {
    console.error("[voice] RETO_KEY is not set");
    return NextResponse.json({ error: t.server.errors.voiceUnavailable }, { status: 503 });
  }

  // The Live language from the settings. "auto" sends none, and the recognizer works out which one is spoken.
  const saved = (await cookies()).get(LIVE_LANG_COOKIE)?.value;
  const live = isLiveLanguage(saved) ? saved : DEFAULT_LIVE_LANGUAGE;

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, audio instanceof File && audio.name ? audio.name : "voz.webm");
  if (live !== "auto") upstreamForm.append("language", live);

  const upstream = await fetch(`${gateway.baseUrl}/stt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gateway.key}` },
    body: upstreamForm,
  }).catch(() => null);

  if (!upstream?.ok) {
    console.error("[voice] transcription request failed:", upstream?.status ?? "sin respuesta");
    return NextResponse.json({ error: t.server.errors.audioFailed }, { status: 502 });
  }

  const result = (await upstream.json().catch(() => null)) as { text?: unknown; language?: unknown } | null;
  return NextResponse.json({
    text: typeof result?.text === "string" ? result.text.trim() : "",
    // The language spoken, so the answer comes back in it: the one that was fixed, else the one detected.
    language: live !== "auto" ? live : languageOf(result?.language),
  });
}
