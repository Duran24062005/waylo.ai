import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { ORIENTATION_MARK } from "@/lib/orientation-note";
import { detectRedFlag, RED_FLAG_MESSAGE } from "@/lib/red-flags";
import { findProviders } from "@/lib/providers";
import { LEGAL_DISCLAIMER, SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { CareLevel, ChatMessage, OrientationCard, TriageResponse } from "@/lib/types";

const LEVEL_LABEL: Record<CareLevel, string> = {
  urgencias: "Urgencias",
  prioritaria: "Consulta Prioritaria",
  general: "Medicina General",
};

const DEFAULT_BASE_URL = "https://api.reto.pltk.mx/v1";
// Non-reasoning: answers in about 1-2 s. grok-4.6 reasons first and takes 12-18 s per turn.
const DEFAULT_MODEL = "grok-4.20-0309-non-reasoning";

// Before an orientation, the model must orient from this many patient replies on instead of asking again.
const MAX_QUESTION_TURNS = 5;
// A reply that is not JSON is only kept as the model's own message when it is this short.
const MAX_PLAIN_REPLY = 600;

const DEFAULT_CHECKLIST = [
  "Documento de identidad",
  "Carné o app de afiliación",
  "Exámenes previos, si los tienes",
  "Orden o autorización, si tu EPS la pide",
];

const llmSchema = z.object({
  mensaje: z.string().optional(),
  listo: z.boolean().optional(),
  nivel: z.enum(["urgencias", "prioritaria", "general"]).optional(),
  justificacion: z.string().optional(),
  queLlevar: z.array(z.string()).optional(),
  opciones: z.array(z.string()).optional(),
});

export interface TriageInput {
  messages: Pick<ChatMessage, "role" | "content">[];
  eps?: string;
}

/** The AI could not answer. The route turns it into an error so the chat offers a retry, not a scripted reply. */
export class TriageUnavailableError extends Error {}

function lastUserText(messages: TriageInput["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

function userTurns(messages: TriageInput["messages"]): number {
  return messages.filter((message) => message.role === "user").length;
}

function buildCard(level: CareLevel, justificacion: string, queLlevar: string[], eps?: string): OrientationCard {
  return {
    nivel: level,
    nivelLabel: LEVEL_LABEL[level],
    justificacion,
    queLlevar: queLlevar.length > 0 ? queLlevar : DEFAULT_CHECKLIST,
    sedes: findProviders(level, eps, 2),
    aviso: LEGAL_DISCLAIMER,
  };
}

function parseModelJson(text: string): z.infer<typeof llmSchema> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return llmSchema.parse(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
}

/**
 * The model sees its own earlier turns in the JSON format it must keep producing.
 * With plain text in the history it copies that style and stops returning JSON.
 */
export function asModelTurn({ role, content }: Pick<ChatMessage, "role" | "content">): { role: ChatMessage["role"]; content: string } {
  if (role === "user") return { role, content };

  const markAt = content.indexOf(ORIENTATION_MARK);
  if (markAt === -1) return { role, content: JSON.stringify({ mensaje: content, listo: false }) };

  const note = content.slice(markAt + ORIENTATION_MARK.length).replace(/^:\s*/, "").replace(/\]\s*$/, "");
  return {
    role,
    content: JSON.stringify({ mensaje: content.slice(0, markAt).trim(), listo: true, orientacion_entregada: note }),
  };
}

function buildSystem(input: TriageInput, priorAlarm: boolean): string {
  const oriented = input.messages.some(
    (message) => message.role === "assistant" && message.content.includes(ORIENTATION_MARK),
  );
  const notes = [`EPS mencionada: ${input.eps || "no indicada"}`];

  if (priorAlarm && !oriented) {
    notes.push(
      "El paciente ya reportó una señal de alarma vital. Responde con listo:true, nivel urgencias y un mensaje breve que lo invite a acudir de inmediato.",
    );
  } else if (oriented) {
    notes.push(
      `Ya entregaste una orientación. Conversa y resuelve dudas con listo:false, sin repetir la tarjeta.${
        priorAlarm ? " Recuerda que hubo una señal de alarma vital: insiste con calidez en acudir a Urgencias." : ""
      }`,
    );
  } else if (userTurns(input.messages) >= MAX_QUESTION_TURNS) {
    notes.push("Ya preguntaste suficiente. Responde ahora con listo:true y la orientación, con lo que el paciente dijo.");
  }

  return `${SYSTEM_PROMPT}\n\n${notes.join("\n\n")}`;
}

export async function runTriage(input: TriageInput): Promise<TriageResponse> {
  // Only the newest message triggers the fixed alert. Later replies go to the model, which knows about the alarm.
  if (detectRedFlag(lastUserText(input.messages)).matched) {
    return { kind: "red_flag", message: RED_FLAG_MESSAGE };
  }
  const priorAlarm = input.messages.some((message) => message.role === "user" && detectRedFlag(message.content).matched);

  const apiKey = process.env.RETO_KEY;
  if (!apiKey) {
    console.error("[triage] RETO_KEY is not set");
    throw new TriageUnavailableError("RETO_KEY is not set");
  }

  // The reto gateway speaks the OpenAI protocol, so the OpenAI provider talks to it directly.
  const reto = createOpenAI({ apiKey, baseURL: process.env.RETO_BASE_URL || DEFAULT_BASE_URL });

  let text: string;
  try {
    const result = await generateText({
      model: reto.chat(process.env.RETO_MODEL || DEFAULT_MODEL),
      temperature: 0.4,
      system: buildSystem(input, priorAlarm),
      // Real roles, so each patient reply is read as the answer to the assistant's previous message.
      messages: input.messages.map(asModelTurn),
    });
    text = result.text;
  } catch (error) {
    const { statusCode, responseBody } = (error ?? {}) as { statusCode?: number; responseBody?: string };
    console.error(
      "[triage] model request failed:",
      statusCode ?? "sin estado",
      responseBody ?? (error instanceof Error ? error.message : error),
    );
    throw new TriageUnavailableError("model request failed");
  }

  const parsed = parseModelJson(text);
  if (!parsed) {
    const plain = text.trim();
    console.error("[triage] model reply was not valid JSON:", plain.slice(0, 120));
    // A plain-text reply is still the model's own message, so it is kept as is.
    if (plain && !plain.includes("{") && plain.length <= MAX_PLAIN_REPLY) {
      return { kind: "question", message: plain };
    }
    throw new TriageUnavailableError("model reply was not usable");
  }

  const message = parsed.mensaje?.trim();

  if (parsed.listo) {
    const level = parsed.nivel ?? "prioritaria";
    return {
      kind: "orientation",
      message: message || "Con lo que me contaste, esta es mi orientación.",
      card: buildCard(
        level,
        parsed.justificacion || "Por los síntomas que describes, este caso se beneficia de una atención en este nivel.",
        parsed.queLlevar ?? DEFAULT_CHECKLIST,
        input.eps,
      ),
    };
  }

  if (!message) throw new TriageUnavailableError("model reply had no message");

  return {
    kind: "question",
    message,
    quickReplies: parsed.opciones?.filter((option) => option.trim()).slice(0, 4),
  };
}
