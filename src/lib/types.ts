export type CareLevel = "urgencias" | "prioritaria" | "general";

export type AttentionType = "Urgencias 24h" | "Prioritaria" | "Externa";

export type ChatRole = "user" | "assistant";

export interface ProviderSite {
  id: string;
  nombre: string;
  tipo_atencion: AttentionType[];
  direccion: string;
  ciudad: string;
  eps_convenio: string[];
  requisitos: string[];
  horario: string;
  telefono: string;
}

/**
 * A file attached to a message. The name and kind are saved with the conversation; the content (a photo or the text of
 * a document) lives in memory while the page is open and is never stored, so it is gone after a reload.
 */
export interface Attachment {
  id: string;
  name: string;
  kind: "image" | "document";
  /** The text of a document. */
  text?: string;
  /** A photo, as a data URL. */
  dataUrl?: string;
  /** The document was longer than what is kept. */
  truncated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: Attachment[];
  /** Orientation attached to this reply, shown right under its text. */
  card?: OrientationCard;
}

export interface OrientationCard {
  nivel: CareLevel;
  nivelLabel: string;
  justificacion: string;
  queLlevar: string[];
  sedes: ProviderSite[];
  aviso: string;
}

/** How many free AI replies a visitor without an account has used. */
export interface GuestUsage {
  used: number;
  limit: number;
  /** Epoch milliseconds when the free replies come back. Only set once they are used up. */
  resetAt?: number;
}

/** How much of the daily and monthly allowance a signed-in account has used, and the wait if it ran out. */
export interface AccountUsage {
  dayUsed: number;
  dayLimit: number;
  monthUsed: number;
  monthLimit: number;
  blocked: { scope: "day" | "month"; resetAt: number } | null;
}

export interface TriageResponse {
  kind: "red_flag" | "question" | "orientation";
  message: string;
  card?: OrientationCard;
  /** Only present for visitors without an account. */
  guest?: GuestUsage;
  /** Only present for signed-in accounts. */
  usage?: AccountUsage;
}

/** A saved chat, kept in the browser. */
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** Pinned conversations are listed first. Pinning changes the order only, not how long they are kept. */
  pinned?: boolean;
  messages: ChatMessage[];
  alertIds: string[];
  errorIds: string[];
}
