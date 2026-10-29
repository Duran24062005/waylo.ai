import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CLINICAL_MEMORY_CATEGORIES,
  createClinicalMemory,
  listClinicalMemory,
} from "@/lib/clinical-memory";
import { getSession } from "@/lib/session";

const proposalSchema = z.object({
  category: z.enum(CLINICAL_MEMORY_CATEGORIES),
  value: z.string().trim().min(1).max(500),
  details: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  try {
    return NextResponse.json({ memories: await listClinicalMemory(session.id) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const parsed = proposalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const memory = await createClinicalMemory(session.id, parsed.data);
    return NextResponse.json({ memory }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
