import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "waylo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  nombre: string;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta AUTH_SECRET");
  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function encode(user: SessionUser): string {
  const body = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionUser | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser & { exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { id: data.id, nombre: data.nombre };
  } catch {
    return null;
  }
}

export async function startSession(user: SessionUser) {
  (await cookies()).set(SESSION_COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    return token ? decode(token) : null;
  } catch {
    return null;
  }
}
