import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { cleanTitle } from "@/lib/conversations";
import { gatewayConfig } from "@/lib/gateway";

// A title is a few words, so it always uses the fast model, whatever model the chat itself is set to.
const TITLE_MODEL = "grok-4.20-0309-non-reasoning";

const TITLE_PROMPT =
  "Resume en un título de 2 a 5 palabras, en español, el motivo de consulta del mensaje de un paciente. " +
  "No uses comillas ni punto final. No des consejos ni diagnósticos. Responde solo con el título.";

/** A short title for a conversation, from its first message. Null when the AI cannot provide one. */
export async function generateTitle(firstMessage: string): Promise<string | null> {
  const gateway = gatewayConfig();
  if (!gateway) return null;

  try {
    const provider = createOpenAI({ apiKey: gateway.key, baseURL: gateway.baseUrl });
    const result = await generateText({
      model: provider.chat(process.env.RETO_TITLE_MODEL || TITLE_MODEL),
      temperature: 0.2,
      system: TITLE_PROMPT,
      messages: [{ role: "user", content: firstMessage }],
    });
    return cleanTitle(result.text) || null;
  } catch (error) {
    console.error("[title] model request failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
