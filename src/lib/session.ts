import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSql } from "@/lib/db";
import { describeDevice } from "@/lib/device";

export const SESSION_COOKIE = "waylo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
/** Activity is written at most this often, so reading a page does not write to the database each time. */
const TOUCH_AFTER_MS = 10 * 60 * 1000;

export interface SessionUser {
  id: string;
  nombre: string;
  /** What the person asked to be called. Null until they choose. */
  apodo: string | null;
  /** This sign-in, so it can be told apart from the person's other devices. */
  sid: string;
}

/** What the cookie carries. Everything else is read from the database, so closing a session takes effect at once. */
interface CookieBody {
  sid: string;
  id: string;
  exp: number;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta AUTH_SECRET");
  return value;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function encode(body: CookieBody): string {
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): CookieBody | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<CookieBody>;
    // A cookie from before sessions were tracked has no sid: the person signs in once more.
    if (typeof data.sid !== "string" || typeof data.id !== "string") return null;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { sid: data.sid, id: data.id, exp: data.exp };
  } catch {
    return null;
  }
}

/** Opens a session for an account: records it, and sets the cookie that proves it. */
export async function startSession(personaId: string) {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const device = describeDevice((await headers()).get("user-agent"));
  const rows = (await getSql()`
    insert into sesiones (persona_id, expira_en, dispositivo)
    values (${personaId}, ${new Date(expiresAt).toISOString()}, ${device})
    returning id
  `) as { id: string }[];

  (await cookies()).set(SESSION_COOKIE, encode({ sid: rows[0].id, id: personaId, exp: expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Closes this device's session. */
export async function endSession() {
  const jar = await cookies();
  const body = decodeCookie(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  if (!body) return;
  try {
    await getSql()`delete from sesiones where id = ${body.sid} and persona_id = ${body.id}`;
  } catch {
    // The cookie is already gone; an unreachable database must not stop signing out.
  }
}

function decodeCookie(token: string | undefined): CookieBody | null {
  try {
    return token ? decode(token) : null;
  } catch {
    return null;
  }
}

interface SessionRecord {
  sid: string;
  id: string;
  nombre: string;
  nombre_preferido: string | null;
  inactiva_ms: number;
}

/** The signed-in account, or null. A session closed from another device, or expired, is no longer valid. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const body = decodeCookie((await cookies()).get(SESSION_COOKIE)?.value);
    if (!body) return null;

    const sql = getSql();
    const rows = (await sql`
      select s.id as sid, p.id, p.nombre, p.nombre_preferido,
        (extract(epoch from (now() - s.ultima_actividad)) * 1000)::float8 as inactiva_ms
      from sesiones s join personas p on p.id = s.persona_id
      where s.id = ${body.sid} and s.persona_id = ${body.id} and s.expira_en > now()
    `) as SessionRecord[];
    const row = rows[0];
    if (!row) return null;

    if (row.inactiva_ms > TOUCH_AFTER_MS) {
      await sql`update sesiones set ultima_actividad = now() where id = ${row.sid}`.catch(() => undefined);
    }
    return { id: row.id, nombre: row.nombre, apodo: row.nombre_preferido, sid: row.sid };
  } catch {
    return null;
  }
});
