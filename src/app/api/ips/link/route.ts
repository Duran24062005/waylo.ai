import { NextResponse } from "next/server";
import { z } from "zod";
import { readSavedCedula } from "@/lib/eps-db";
import { getIpsLink, IpsBackendError, linkIps, unlinkIps } from "@/lib/ips-backend";
import { getSession } from "@/lib/session";
import { reportError } from "@/lib/error-report";

const linkSchema = z.object({
  document_type: z.string().trim().min(2).max(20),
  // Left out when the person already saved it in the EPS section: then the server reads it, and it never travels back.
  document_number: z.string().trim().regex(/^\d{5,12}$/).optional(),
  eps: z.literal("confianza"),
  activation_code: z.string().regex(/^\d{6}$/),
});

function errorResponse(error: unknown) {
  // A person without a link or with a wrong code is not a failure; the backend being down is.
  if (!(error instanceof IpsBackendError) || error.status >= 500) reportError("api/ips/link", error);
  if (error instanceof IpsBackendError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "ips_unavailable" }, { status: 503 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    return NextResponse.json(await getIpsLink(session.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = linkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const documentNumber = parsed.data.document_number ?? (await readSavedCedula(session.id).catch(() => null));
    if (!documentNumber) return NextResponse.json({ error: "CEDULA_REQUIRED" }, { status: 400 });
    return NextResponse.json(await linkIps(session.id, { ...parsed.data, document_number: documentNumber, eps: "Confianza" }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    return NextResponse.json(await unlinkIps(session.id));
  } catch (error) {
    return errorResponse(error);
  }
}
