import { NextResponse } from "next/server";
import { getIpsAppointments, IpsBackendError } from "@/lib/ips-backend";
import { getSession } from "@/lib/session";
import { reportError } from "@/lib/error-report";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    return NextResponse.json(await getIpsAppointments(session.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof IpsBackendError) || error.status >= 500) reportError("api/ips/appointments", error);
    const status = error instanceof IpsBackendError ? error.status : 503;
    const body = error instanceof IpsBackendError ? { error: error.code, message: error.message } : { error: "ips_unavailable" };
    return NextResponse.json(body, { status });
  }
}
