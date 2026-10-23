import { generateText, type ModelMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { Locale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";
import { documentBlock, MAX_HISTORY_DOCUMENT_CHARS, type ModelAttachment } from "@/lib/attachments";
import { ORIENTATION_MARK } from "@/lib/orientation-note";
import { detectRedFlag, redFlagMessage } from "@/lib/red-flags";
import { findProviders } from "@/lib/providers";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { CareLevel, ChatMessage, OrientationCard, TriageResponse } from "@/lib/types";

const DEFAULT_BASE_URL = "https://api.reto.pltk.mx/v1";
// Non-reasoning: answers in about 1-2 s. grok-4.6 reasons first and takes 12-18 s per turn.
const DEFAULT_MODEL = "grok-4.20-0309-non-reasoning";

// Before an orientation, the model must orient from this many patient replies on instead of asking again.
const MAX_QUESTION_TURNS = 5;
// A reply that is not JSON is only kept as the model's own message when it is this short.
const MAX_PLAIN_REPLY = 600;

const llmSchema = z.object({
  mensaje: z.string().optional(),
  listo: z.boolean().optional(),
  nivel: z.enum(["urgencias", "prioritaria", "general"]).optional(),
  justificacion: z.string().optional(),
  queLlevar: z.array(z.string()).optional(),
});

/** A message as the AI gets it: what was said, and the checked files that came with it. */
export interface TriageMessage extends Pick<ChatMessage, "role" | "content"> {
  attachments?: ModelAttachment[];
}

export interface TriageInput {
  messages: TriageMessage[];
  /** The language of the reply, its fixed texts and the card. Spanish when not given. */
  locale?: Locale;
  /** What the patient likes to be called, when they have said so in their settings. */
  name?: string;
  eps?: string;
  /** Set when the patient pressed "Reintentar": the reply they were not happy with, so the new one is different. */
  avoid?: string;
}

const TEMPERATURE = 0.4;
// A retry needs room to say it another way, so the model is allowed to vary more.
const RETRY_TEMPERATURE = 0.9;
const MAX_AVOID_CHARS = 800;

function retryNote(previous: string): string {
  return (
    "El paciente pidió otra respuesta a su último mensaje, porque la anterior no le convenció o no era lo que esperaba. " +
    `Tu respuesta anterior fue: «${previous.slice(0, MAX_AVOID_CHARS)}». ` +
    "Responde a esa misma consulta de otra manera: un enfoque distinto, otras palabras y otro orden, sin repetir frases ni la misma pregunta. " +
    "Mantén el mismo criterio clínico: no cambies el nivel de atención ni la urgencia sin una razón nueva."
  );
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

function buildCard(
  level: CareLevel,
  justificacion: string,
  queLlevar: string[],
  locale: Locale,
  eps?: string,
): OrientationCard {
  const t = messages[locale];
  return {
    nivel: level,
    nivelLabel: t.levels[level],
    justificacion,
    queLlevar: queLlevar.length > 0 ? queLlevar : t.server.checklist,
    sedes: findProviders(level, eps, 2, locale),
    aviso: t.server.disclaimer,
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

/**
 * The conversation as the model reads it. A document's text goes into its message, newest first up to a total limit,
 * so a follow-up question about it still works. A photo goes only with the message that carried it: it is the heavy
 * part, and the replies that followed already say what it showed.
 */
export function toModelMessages(messages: TriageMessage[]): ModelMessage[] {
  const lastUser = messages.map((message) => message.role).lastIndexOf("user");
  let documentChars = 0;
  const out: ModelMessage[] = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const files = message.attachments ?? [];
    if (message.role !== "user" || files.length === 0) {
      out.push(asModelTurn(message));
      continue;
    }

    const blocks: string[] = [];
    const images: Extract<ModelAttachment, { kind: "image" }>[] = [];
    for (const file of files) {
      if (file.kind === "past-image") {
        blocks.push(`[El paciente adjuntó antes la imagen «${file.name}»; ya se la comentaste.]`);
      } else if (file.kind === "image") {
        if (index === lastUser) images.push(file);
        else blocks.push(`[El paciente adjuntó antes la imagen «${file.name}»; ya se la comentaste.]`);
      } else if (documentChars + file.text.length <= MAX_HISTORY_DOCUMENT_CHARS) {
        documentChars += file.text.length;
        blocks.push(documentBlock(file));
      } else {
        blocks.push(`[El paciente adjuntó antes el documento «${file.name}»; ya no se reenvía por su tamaño.]`);
      }
    }

    const text = [message.content, ...blocks].filter(Boolean).join("\n\n");
    out.push(
      images.length === 0
        ? { role: "user", content: text }
        : {
            role: "user",
            content: [
              { type: "text", text },
              ...images.map((image) => ({
                type: "file" as const,
                mediaType: image.mediaType,
                data: { type: "data" as const, data: image.bytes },
              })),
            ],
          },
    );
  }
  return out.reverse();
}

/** A nickname goes into the prompt, so only plain name characters get through, whatever the settings hold. */
function safeName(name: string | undefined): string {
  return (name ?? "").replace(/[^\p{L}\p{M}'’ .-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 30);
}

function buildSystem(input: TriageInput, priorAlarm: boolean, locale: Locale): string {
  const oriented = input.messages.some(
    (message) => message.role === "assistant" && message.content.includes(ORIENTATION_MARK),
  );
  const language = messages[locale].server.answerLanguage;
  const notes = [
    `EPS mencionada: ${input.eps || "no indicada"}`,
    // The instructions above are in Spanish; the patient's language is the one the reply is written in.
    `Idioma de la conversación: ${language}. Escribe TODA tu respuesta en ${language}: el campo "mensaje", y también "justificacion" y "queLlevar". No cambies de idioma aunque el historial esté en otro.`,
  ];
  const name = safeName(input.name);
  if (name) notes.push(`El paciente prefiere que lo llames «${name}». Úsalo con naturalidad, sin repetirlo en cada mensaje.`);

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

  if (input.avoid?.trim()) notes.push(retryNote(input.avoid.trim()));

  return `${SYSTEM_PROMPT}\n\n${notes.join("\n\n")}`;
}

export async function runTriage(input: TriageInput): Promise<TriageResponse> {
  // Only the newest message triggers the fixed alert. Later replies go to the model, which knows about the alarm.
  const locale = input.locale ?? "es";
  if (detectRedFlag(lastUserText(input.messages)).matched) {
    return { kind: "red_flag", message: redFlagMessage(locale) };
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
      temperature: input.avoid?.trim() ? RETRY_TEMPERATURE : TEMPERATURE,
      system: buildSystem(input, priorAlarm, locale),
      // Real roles, so each patient reply is read as the answer to the assistant's previous message.
      messages: toModelMessages(input.messages),
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
      message: message || messages[locale].server.defaultMessage,
      card: buildCard(
        level,
        parsed.justificacion || messages[locale].server.defaultReason,
        parsed.queLlevar ?? [],
        locale,
        input.eps,
      ),
    };
  }

  if (!message) throw new TriageUnavailableError("model reply had no message");

  return { kind: "question", message };
}
