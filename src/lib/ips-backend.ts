import type { IpsAppointment, IpsLinkState, IpsPatient } from "@/lib/ips";

export class IpsBackendError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function backendConfig(): { baseUrl: string; key: string } {
  const baseUrl = process.env.WAYLO_BACKEND_URL?.replace(/\/+$/, "");
  const key = process.env.WAYLO_BACKEND_KEY;
  if (!baseUrl || !key) throw new IpsBackendError("integration_unconfigured", 503, "La integración IPS no está configurada");
  return { baseUrl, key };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, key } = backendConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        "X-Waylo-Internal-Key": key,
        ...init.headers,
      },
    });
  } catch {
    throw new IpsBackendError("backend_unavailable", 503, "El backend de integración no responde");
  }

  const body = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | T | null;
  if (!response.ok) {
    const error =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null
        ? (body.error as { code?: string; message?: string })
        : null;
    throw new IpsBackendError(error?.code ?? "ips_unavailable", response.status, error?.message ?? "La IPS no responde");
  }
  return body as T;
}

export function getIpsLink(subject: string): Promise<IpsLinkState> {
  return request<IpsLinkState>(`/internal/ips/link?external_subject=${encodeURIComponent(subject)}`);
}

export function linkIps(subject: string, payload: {
  document_type: string;
  document_number: string;
  eps: string;
  activation_code: string;
}): Promise<IpsLinkState> {
  return request<IpsLinkState>("/internal/ips/link", {
    method: "POST",
    body: JSON.stringify({ ...payload, external_subject: subject, ips_id: "confianza" }),
  });
}

export function unlinkIps(subject: string): Promise<IpsLinkState> {
  return request<IpsLinkState>(`/internal/ips/link?external_subject=${encodeURIComponent(subject)}`, { method: "DELETE" });
}

export function getIpsPatient(subject: string): Promise<IpsPatient> {
  return request<IpsPatient>(`/internal/ips/patient?external_subject=${encodeURIComponent(subject)}`);
}

export function getIpsAppointments(subject: string): Promise<IpsAppointment[]> {
  return request<IpsAppointment[]>(`/internal/ips/appointments?external_subject=${encodeURIComponent(subject)}`);
}
