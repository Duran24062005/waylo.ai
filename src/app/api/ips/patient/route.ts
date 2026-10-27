import { NextResponse } from "next/server";
import { getIpsPatient, IpsBackendError } from "@/lib/ips-backend";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    return NextResponse.json(await getIpsPatient(session.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof IpsBackendError ? error.status : 503;
    const body = error instanceof IpsBackendError ? { error: error.code, message: error.message } : { error: "ips_unavailable" };
    return NextResponse.json(body, { status });
  }
}
