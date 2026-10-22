import { NextResponse } from "next/server";
import { gatewayConfig } from "@/lib/gateway";

export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "Audio no válido." }, { status: 400 });
  }

  const gateway = gatewayConfig();
  if (!gateway) {
    console.error("[voice] RETO_KEY is not set");
    return NextResponse.json({ error: "La voz no está disponible." }, { status: 503 });
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, audio instanceof File && audio.name ? audio.name : "voz.webm");
  upstreamForm.append("language", "es");

  const upstream = await fetch(`${gateway.baseUrl}/stt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gateway.key}` },
    body: upstreamForm,
  }).catch(() => null);

  if (!upstream?.ok) {
    console.error("[voice] transcription request failed:", upstream?.status ?? "sin respuesta");
    return NextResponse.json({ error: "No pude entender el audio." }, { status: 502 });
  }

  const result = (await upstream.json().catch(() => null)) as { text?: unknown } | null;
  return NextResponse.json({ text: typeof result?.text === "string" ? result.text.trim() : "" });
}
