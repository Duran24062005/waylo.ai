import { NextResponse } from "next/server";
import { runTriage } from "@/lib/triage";
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

  const result = await runTriage({
    messages: body.messages.slice(-12),
    eps: body.eps,
  });

  return NextResponse.json(result);
}
