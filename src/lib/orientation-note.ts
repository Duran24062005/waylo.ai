import type { OrientationCard } from "@/lib/types";

/** Marks a reply that already carried an orientation card. Both the client and the model rely on it. */
export const ORIENTATION_MARK = "[Orientación entregada";

/** What the model is told about a card the patient has already seen. */
export function orientationNote(card: OrientationCard): string {
  return `${ORIENTATION_MARK}: ${card.nivelLabel}. ${card.justificacion}]`;
}
