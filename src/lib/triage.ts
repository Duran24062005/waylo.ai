import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
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
const DEFAULT_MODEL = "grok-4.6";

const DEFAULT_CHECKLIST = [
  "Documento de identidad",
  "Carné o app de afiliación",
  "Exámenes previos, si los tienes",
  "Orden o autorización, si tu EPS la pide",
];

const llmSchema = z.object({
  listo: z.boolean(),
  nivel: z.enum(["urgencias", "prioritaria", "general"]).optional(),
  justificacion: z.string().optional(),
  queLlevar: z.array(z.string()).optional(),
  pregunta: z.string().optional(),
  opciones: z.array(z.string()).optional(),
});

export interface TriageInput {
  messages: Pick<ChatMessage, "role" | "content">[];
  eps?: string;
}

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

function fallbackTriage(messages: TriageInput["messages"], eps?: string): TriageResponse {
  const turns = userTurns(messages);
  const text = lastUserText(messages).toLowerCase();

  if (turns < 2) {
    return {
      kind: "question",
      message: "¿Desde cuándo lo sientes?",
      quickReplies: ["Hoy", "Hace unos días", "Hace más de una semana"],
    };
  }

  if (turns < 3) {
    return {
      kind: "question",
      message: "¿Qué tan fuerte es ahora, de 1 a 10?",
      quickReplies: ["Leve (1-3)", "Moderado (4-6)", "Fuerte (7-10)"],
    };
  }

  if (turns < 4) {
    return {
      kind: "question",
      message: "¿Ha empeorado o te impide hacer tus actividades?",
      quickReplies: ["Sí, empeora", "Está igual", "Va mejorando"],
    };
  }

  const severe = /fuerte|7|8|9|10|empeora|mucho|intenso/.test(text);
  const mild = /leve|mejorando|1|2|3|semana/.test(text);
  const level: CareLevel = severe ? "prioritaria" : mild ? "general" : "prioritaria";

  const card = buildCard(
    level,
    level === "general"
      ? "Por lo que cuentas, no parece una alarma inmediata. Una cita de medicina general puede orientarte."
      : "Por lo que cuentas, conviene una valoración pronto, sin esperar una cita ordinaria.",
    DEFAULT_CHECKLIST,
    eps,
  );

  return {
    kind: "orientation",
    message: "Con lo que me contaste, esta es la orientación.",
    card,
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

export async function runTriage(input: TriageInput): Promise<TriageResponse> {
  const latest = lastUserText(input.messages);

  if (detectRedFlag(latest).matched || input.messages.some((message) => message.role === "user" && detectRedFlag(message.content).matched)) {
    return { kind: "red_flag", message: RED_FLAG_MESSAGE };
  }

  const apiKey = process.env.RETO_KEY;
  if (!apiKey) {
    return fallbackTriage(input.messages, input.eps);
  }

  // The reto gateway speaks the OpenAI protocol, so the OpenAI provider talks to it directly.
  const reto = createOpenAI({ apiKey, baseURL: process.env.RETO_BASE_URL || DEFAULT_BASE_URL });
  const transcript = input.messages
    .map((message) => `${message.role === "user" ? "Paciente" : "Navegador"}: ${message.content}`)
    .join("\n");

  try {
    const result = await generateText({
      model: reto.chat(process.env.RETO_MODEL || DEFAULT_MODEL),
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      prompt: `EPS mencionada: ${input.eps || "no indicada"}\n\nConversación:\n${transcript}`,
    });

    const parsed = parseModelJson(result.text);
    if (!parsed) {
      console.error("[triage] model reply was not valid JSON, using fallback");
      return fallbackTriage(input.messages, input.eps);
    }

    if (!parsed.listo) {
      return {
        kind: "question",
        message: parsed.pregunta || "¿Puedes contarme un poco más, con tus palabras?",
        quickReplies: parsed.opciones?.slice(0, 4),
      };
    }

    const level = parsed.nivel ?? "prioritaria";
    return {
      kind: "orientation",
      message: "Con lo que me contaste, esta es la orientación.",
      card: buildCard(
        level,
        parsed.justificacion || "Por los síntomas que describes, este caso se beneficia de una atención en este nivel.",
        parsed.queLlevar ?? DEFAULT_CHECKLIST,
        input.eps,
      ),
    };
  } catch (error) {
    const { statusCode, responseBody } = (error ?? {}) as { statusCode?: number; responseBody?: string };
    console.error(
      "[triage] model request failed, using fallback:",
      statusCode ?? "sin estado",
      responseBody ?? (error instanceof Error ? error.message : error),
    );
    return fallbackTriage(input.messages, input.eps);
  }
}
