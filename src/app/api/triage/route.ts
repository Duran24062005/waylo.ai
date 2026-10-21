import { NextResponse } from "next/server";
import { runTriage } from "@/lib/triage";
import type { ChatMessage } from "@/lib/types";

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
