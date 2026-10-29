import type { ModelMessage } from "ai";

export interface PendingAppointment {
  token: string;
  action: "create_appointment" | "cancel_appointment" | "reschedule_appointment";
  summary: string;
}

export interface ChatBackendCompletionInput {
  model: string;
  temperature: number;
  system: string;
  messages: ModelMessage[];
  externalSubject?: string;
  pendingAppointmentToken?: string;
}

export interface ChatBackendCompletion {
  text: string;
  pendingAppointment?: PendingAppointment;
}

export class ChatBackendError extends Error {
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
  if (!baseUrl || !key) {
    throw new ChatBackendError(
      "integration_unconfigured",
      503,
      "La integración conversacional de Waylo no está configurada",
    );
  }
  return { baseUrl, key };
}

export async function completeWithWayloBackend(input: ChatBackendCompletionInput): Promise<ChatBackendCompletion> {
  const { baseUrl, key } = backendConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/internal/chat/completion`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Waylo-Internal-Key": key,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature,
        system: input.system,
        messages: input.messages,
        ...(input.externalSubject ? { external_subject: input.externalSubject } : {}),
        ...(input.pendingAppointmentToken ? { pending_appointment_token: input.pendingAppointmentToken } : {}),
      }),
    });
  } catch {
    throw new ChatBackendError("backend_unavailable", 503, "El backend conversacional no responde");
  }

  const body = (await response.json().catch(() => null)) as {
    text?: unknown;
    pending_appointment?: PendingAppointment;
    error?: { code?: string; message?: string };
  } | null;

  if (!response.ok) {
    throw new ChatBackendError(
      body?.error?.code ?? "chat_unavailable",
      response.status,
      body?.error?.message ?? "El backend conversacional no pudo responder",
    );
  }

  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    throw new ChatBackendError("invalid_backend_response", 502, "El backend conversacional devolvió una respuesta vacía");
  }

  return {
    text: body.text,
    pendingAppointment: body.pending_appointment,
  };
}
