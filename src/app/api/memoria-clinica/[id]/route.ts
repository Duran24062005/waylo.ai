import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CLINICAL_MEMORY_CATEGORIES,
  deleteClinicalMemory,
  updateClinicalMemory,
} from "@/lib/clinical-memory";
import { getSession } from "@/lib/session";

const patchSchema = z.object({
  category: z.enum(CLINICAL_MEMORY_CATEGORIES).optional(),
  value: z.string().trim().min(1).max(500).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["active", "resolved"]).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "empty" });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const memory = await updateClinicalMemory(session.id, id, parsed.data);
    return memory
      ? NextResponse.json({ memory })
      : NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { id } = await context.params;
  try {
    const deleted = await deleteClinicalMemory(session.id, id);
    return deleted
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
