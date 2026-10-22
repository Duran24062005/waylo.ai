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
// Non-reasoning: answers in about 1-2 s. grok-4.6 reasons first and takes 12-18 s per turn.
const DEFAULT_MODEL = "grok-4.20-0309-non-reasoning";

// From this many patient replies on, the model must orient instead of asking again.
const MAX_QUESTION_TURNS = 5;

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

  // Only the newest message triggers the fixed alert. Later replies go to the model, which knows about the alarm.
  if (detectRedFlag(latest).matched) {
    return { kind: "red_flag", message: RED_FLAG_MESSAGE };
  }
  const priorAlarm = input.messages.some((message) => message.role === "user" && detectRedFlag(message.content).matched);

  const apiKey = process.env.RETO_KEY;
  if (!apiKey) {
    return fallbackTriage(input.messages, input.eps);
  }

  // The reto gateway speaks the OpenAI protocol, so the OpenAI provider talks to it directly.
  const reto = createOpenAI({ apiKey, baseURL: process.env.RETO_BASE_URL || DEFAULT_BASE_URL });

  try {
    const result = await generateText({
      model: reto.chat(process.env.RETO_MODEL || DEFAULT_MODEL),
      temperature: 0.1,
      system: `${SYSTEM_PROMPT}\n\nEPS mencionada: ${input.eps || "no indicada"}${
        userTurns(input.messages) >= MAX_QUESTION_TURNS
          ? "\n\nYa hiciste suficientes preguntas. Responde ahora con listo:true y la orientación, con lo que el paciente dijo."
          : ""
      }${
        priorAlarm
          ? "\n\nEl paciente ya reportó una señal de alarma vital. Responde con listo:true, nivel urgencias y una justificación breve que lo invite a acudir de inmediato."
          : ""
      }`,
      // Real roles, so each patient reply is read as the answer to the assistant's previous question.
      messages: input.messages.map(({ role, content }) => ({ role, content })),
    });

    const parsed = parseModelJson(result.text);
    if (!parsed) {
      const plain = result.text.trim();
      console.error("[triage] model reply was not valid JSON:", plain.slice(0, 120));
      // A plain-text reply is still the model's own question, so keep it instead of the scripted fallback.
      if (plain && !plain.includes("{") && plain.length <= 300) {
        return { kind: "question", message: plain };
      }
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
