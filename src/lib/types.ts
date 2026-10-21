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

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface OrientationCard {
  nivel: CareLevel;
  nivelLabel: string;
  justificacion: string;
  queLlevar: string[];
  sedes: ProviderSite[];
  aviso: string;
}

export interface TriageResponse {
  kind: "red_flag" | "question" | "orientation";
  message: string;
  card?: OrientationCard;
  quickReplies?: string[];
}
