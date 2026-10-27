export type FeedbackVote = "like" | "dislike";

export interface FeedbackNotice {
  vote: FeedbackVote;
  /** Id of the reply that was rated. The text of the conversation is never sent. */
  messageId: string;
  locale: string;
  signedIn: boolean;
  /** Epoch milliseconds. */
  at: number;
}

const WEBHOOK_HOST = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\//;
const GREEN = 0x2e7d32;
const RED = 0xc62828;
const TIMEOUT_MS = 5000;

/** Reads the webhook from the environment. Anything that is not a Discord webhook counts as not configured. */
export function discordWebhookUrl(): string | null {
  const url = process.env.DISCORD_FEEDBACK_WEBHOOK_URL?.trim();
  return url && WEBHOOK_HOST.test(url) ? url : null;
}

export function feedbackPayload({ vote, messageId, locale, signedIn, at }: FeedbackNotice) {
  const liked = vote === "like";
  return {
    // Nothing the person wrote can ping anyone: only these fixed fields go out.
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: liked ? "👍 Respuesta útil" : "👎 Respuesta no útil",
        color: liked ? GREEN : RED,
        fields: [
          { name: "Usuario", value: signedIn ? "Cuenta registrada" : "Invitado", inline: true },
          { name: "Idioma", value: locale, inline: true },
          { name: "Mensaje", value: `\`${messageId.slice(0, 40)}\``, inline: true },
        ],
        timestamp: new Date(at).toISOString(),
      },
    ],
  };
}

/** Tells the owner's Discord channel about a vote. Returns false when it is not configured or Discord did not accept it. */
export async function sendFeedbackToDiscord(notice: FeedbackNotice): Promise<boolean> {
  const url = discordWebhookUrl();
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackPayload(notice)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}
