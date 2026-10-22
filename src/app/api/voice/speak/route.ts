import { NextResponse } from "next/server";
import { gatewayConfig } from "@/lib/gateway";

export const maxDuration = 30;

// One spoken chunk. The client splits longer replies into sentences.
const MAX_CHARS = 600;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) {
    return NextResponse.json({ error: "Texto no válido." }, { status: 400 });
  }

  const gateway = gatewayConfig();
  if (!gateway) {
    console.error("[voice] RETO_KEY is not set");
    return NextResponse.json({ error: "La voz no está disponible." }, { status: 503 });
  }

  const upstream = await fetch(`${gateway.baseUrl}/tts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gateway.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: process.env.RETO_VOICE || "ara", language: "es-MX" }),
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    console.error("[voice] speech request failed:", upstream?.status ?? "sin respuesta");
    return NextResponse.json({ error: "No pude generar la voz." }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: { "Content-Type": upstream.headers.get("content-type") || "audio/mpeg", "Cache-Control": "no-store" },
  });
}
