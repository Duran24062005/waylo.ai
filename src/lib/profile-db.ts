import { getSql } from "@/lib/db";
import { SEXES, type Profile, type ProfilePatch, type Sex } from "@/lib/profile";

interface ProfileRecord {
  nombre: string;
  nombre_preferido: string | null;
  email: string;
  sexo: string | null;
  ciudad: string | null;
  nacionalidad: string | null;
  tiene_password: boolean;
}

export async function getProfile(personaId: string): Promise<Profile | null> {
  const rows = (await getSql()`
    select nombre, nombre_preferido, email, sexo, ciudad, nacionalidad, (password_hash is not null) as tiene_password
    from personas where id = ${personaId}
  `) as ProfileRecord[];
  const row = rows[0];
  if (!row) return null;
  return {
    nombre: row.nombre,
    apodo: row.nombre_preferido,
    email: row.email,
    sexo: (SEXES as readonly string[]).includes(row.sexo ?? "") ? (row.sexo as Sex) : null,
    ciudad: row.ciudad,
    nacionalidad: row.nacionalidad,
    tienePassword: row.tiene_password,
  };
}

/** Saves only the fields that came in. */
export async function updateProfile(personaId: string, patch: ProfilePatch): Promise<void> {
  const sql = getSql();
  if (patch.nombre !== undefined) await sql`update personas set nombre = ${patch.nombre} where id = ${personaId}`;
  if (patch.apodo !== undefined) await sql`update personas set nombre_preferido = ${patch.apodo} where id = ${personaId}`;
  if (patch.sexo !== undefined) await sql`update personas set sexo = ${patch.sexo} where id = ${personaId}`;
  if (patch.ciudad !== undefined) await sql`update personas set ciudad = ${patch.ciudad} where id = ${personaId}`;
  if (patch.nacionalidad !== undefined) {
    await sql`update personas set nacionalidad = ${patch.nacionalidad} where id = ${personaId}`;
  }
}

/** One signed-in device. */
export interface SessionInfo {
  id: string;
  /** "Chrome · Windows", or empty when it could not be told. */
  dispositivo: string;
  /** Epoch milliseconds. */
  creadaEn: number;
  ultimaActividad: number;
  actual: boolean;
}

interface SessionRecord {
  id: string;
  dispositivo: string;
  creada_ms: number;
  actividad_ms: number;
}

export async function listSessions(personaId: string, currentSid: string): Promise<SessionInfo[]> {
  const rows = (await getSql()`
    select id, dispositivo,
      (extract(epoch from creada_en) * 1000)::float8 as creada_ms,
      (extract(epoch from ultima_actividad) * 1000)::float8 as actividad_ms
    from sesiones
    where persona_id = ${personaId} and expira_en > now()
    order by ultima_actividad desc
  `) as SessionRecord[];
  return rows.map((row) => ({
    id: row.id,
    dispositivo: row.dispositivo,
    creadaEn: Math.round(row.creada_ms),
    ultimaActividad: Math.round(row.actividad_ms),
    actual: row.id === currentSid,
  }));
}

/** Closes one of the account's sessions. Returns false when it is not this account's or does not exist. */
export async function closeSession(personaId: string, sessionId: string): Promise<boolean> {
  const rows = (await getSql()`
    delete from sesiones where id::text = ${sessionId} and persona_id = ${personaId} returning id
  `) as { id: string }[];
  return rows.length > 0;
}

/** Closes every session of the account except the one in use. */
export async function closeOtherSessions(personaId: string, currentSid: string): Promise<number> {
  const rows = (await getSql()`
    delete from sesiones where persona_id = ${personaId} and id <> ${currentSid} returning id
  `) as { id: string }[];
  return rows.length;
}
