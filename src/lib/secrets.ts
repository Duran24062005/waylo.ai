import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encryption for the few things stored that must not be readable from the database alone (an ID number, a code from
 * an insurer). AES-256-GCM: it hides the text and also notices if it was changed. The key comes from AUTH_SECRET,
 * so nothing new has to be configured; changing AUTH_SECRET makes what was stored unreadable (as it signs everyone out).
 */
function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET");
  return Buffer.from(hkdfSync("sha256", secret, "waylo-secrets-salt-v1", "waylo-stored-secrets-v1", 32));
}

const b64 = (data: Buffer) => data.toString("base64url");

/** "v1.iv.tag.ciphertext". A new random iv each time, so the same text never looks the same twice. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", b64(iv), b64(cipher.getAuthTag()), b64(body)].join(".");
}

/** The text, or null when the token is malformed, was changed, or was made with another key. */
export function decryptSecret(token: string | null | undefined): string | null {
  if (!token) return null;
  const [version, iv, tag, body] = token.split(".");
  if (version !== "v1" || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
