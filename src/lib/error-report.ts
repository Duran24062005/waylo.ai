import { after } from "next/server";
import { postToDiscord, webhookFromEnv } from "@/lib/discord";

/** Extra facts about where the error happened. Never put what a person wrote or any personal data here. */
export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

const RED = 0xc62828;
const MAX_MESSAGE_CHARS = 600;
const MAX_STACK_CHARS = 900;
const MAX_VALUE_CHARS = 200;
const STACK_LINES = 6;
/** The same error from the same place is sent once per this long, so an outage does not bury the channel. */
const REPEAT_MS = 60 * 1000;
/** Discord accepts about 30 messages a minute per webhook; stay well under it. */
const MAX_PER_MINUTE = 20;
const MAX_TRACKED = 200;

interface Seen {
  at: number;
  suppressed: number;
}

const seen = new Map<string, Seen>();
let sentAt: number[] = [];

/** Hides what must not reach a chat even for the team: passwords in URLs, tokens, long keys and email addresses. */
export function redact(text: string): string {
  return text
    .replace(/(\/\/)[^\s/@'"]+@/g, "$1[redacted]@")
    .replace(/([?&](?:key|token|secret|password|sig|signature|code)=)[^&\s'"]+/gi, "$1[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, "[redacted]");
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const fence = (text: string) => `\`\`\`\n${text.replace(/```/g, "'''")}\n\`\`\``;

function describe(error: unknown): { name: string; message: string; stack: string | null; code: string | null; status: number | null } {
  if (error instanceof Error) {
    const extra = error as Error & { code?: unknown; status?: unknown };
    const stack = error.stack
      ?.split("\n")
      .slice(1, 1 + STACK_LINES)
      .map((line) => line.trim())
      .join("\n");
    return {
      name: error.name,
      message: error.message,
      stack: stack || null,
      code: typeof extra.code === "string" || typeof extra.code === "number" ? String(extra.code) : null,
      status: typeof extra.status === "number" ? extra.status : null,
    };
  }
  let message: string;
  try {
    message = typeof error === "string" ? error : JSON.stringify(error);
  } catch {
    message = String(error);
  }
  return { name: "Unknown", message: message ?? String(error), stack: null, code: null, status: null };
}

export function errorReportPayload(source: string, error: unknown, context: ErrorContext = {}, repeats = 0) {
  const info = describe(error);
  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: "Entorno", value: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown", inline: true },
  ];
  if (info.status !== null) fields.push({ name: "Estado", value: String(info.status), inline: true });
  if (info.code !== null) fields.push({ name: "Código", value: clip(redact(info.code), MAX_VALUE_CHARS), inline: true });
  for (const [name, value] of Object.entries(context)) {
    if (value === undefined || value === null) continue;
    fields.push({ name, value: clip(redact(String(value)), MAX_VALUE_CHARS) || "-", inline: true });
  }
  if (repeats > 0) fields.push({ name: "Repetidos omitidos", value: `${repeats} en el último minuto`, inline: true });
  if (info.stack) fields.push({ name: "Stack", value: fence(clip(redact(info.stack), MAX_STACK_CHARS)), inline: false });

  return {
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: clip(`🔴 Error en ${source}`, 250),
        description: fence(clip(redact(`${info.name}: ${info.message}`), MAX_MESSAGE_CHARS)),
        color: RED,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** Decides whether this error may go out now. Repeats inside the window are only counted. */
function allow(key: string, now: number): { send: boolean; repeats: number } {
  const previous = seen.get(key);
  if (previous && now - previous.at < REPEAT_MS) {
    previous.suppressed += 1;
    return { send: false, repeats: 0 };
  }
  sentAt = sentAt.filter((at) => now - at < 60 * 1000);
  if (sentAt.length >= MAX_PER_MINUTE) return { send: false, repeats: 0 };
  sentAt.push(now);

  seen.set(key, { at: now, suppressed: 0 });
  if (seen.size > MAX_TRACKED) {
    for (const [other, state] of seen) if (now - state.at >= REPEAT_MS) seen.delete(other);
  }
  return { send: true, repeats: previous?.suppressed ?? 0 };
}

/** Sends the error to the errors channel and resolves when Discord has answered. Does nothing if the channel is not configured. */
export async function sendErrorReport(source: string, error: unknown, context: ErrorContext = {}): Promise<void> {
  // Errors while developing on a laptop stay in the terminal.
  if (process.env.NODE_ENV === "development") return;
  const url = webhookFromEnv("DISCORD_ERRORS_WEBHOOK_URL");
  if (!url) return;
  try {
    const info = describe(error);
    const { send, repeats } = allow(`${source}|${info.name}|${info.message.slice(0, 120)}`, Date.now());
    if (!send) return;
    await postToDiscord(url, errorReportPayload(source, error, context, repeats));
  } catch {
    // Reporting an error must never cause another one.
  }
}

/** For route handlers: reports in the background once the response is on its way, and never throws. */
export function reportError(source: string, error: unknown, context: ErrorContext = {}): void {
  const task = sendErrorReport(source, error, context);
  try {
    after(() => task);
  } catch {
    // Outside a request there is no "after"; the send continues on its own.
    void task;
  }
}
