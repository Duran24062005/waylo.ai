import type { MascotState } from "@/components/mascot";

/** What the assistant is doing, in plain Spanish. One line per mascot state. */
export const STATUS_COPY: Record<MascotState, string> = {
  idle: "Listo para ayudarte",
  listening: "Te escucho",
  thinking: "Pensando",
  speaking: "Respondiendo",
  alert: "Esto necesita atención inmediata",
  success: "Tu orientación está lista",
  error: "Algo salió mal",
  private: "No estoy mirando",
  muted: "Micrófono silenciado",
};
