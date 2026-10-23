import { getSql } from "@/lib/db";

/** Replies a registered account gets per day. Reaching it means a wait before the next one. */
export const DAILY_LIMIT = 100;
export const DAILY_WAIT_MS = 12 * 60 * 60 * 1000;
/** Replies a registered account gets per month. Reaching it means waiting for the next month. */
export const MONTHLY_LIMIT = 2000;

// Days and months are counted in Colombian time (UTC-5, no daylight saving).
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

function bogotaDate(now: number): Date {
  return new Date(now + BOGOTA_OFFSET_MS);
}

export function bogotaDay(now: number): string {
  const d = bogotaDate(now);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function bogotaMonth(now: number): string {
  return bogotaDay(now).slice(0, 7);
}

/** The first instant of next month in Colombian time, as epoch milliseconds. */
export function nextMonthStart(now: number): number {
  const d = bogotaDate(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - BOGOTA_OFFSET_MS;
}

/** What is stored for an account. */
export interface UsageRow {
  /** The Colombian day the daily count belongs to (YYYY-MM-DD). */
  dia: string;
  usadasDia: number;
  /** Epoch milliseconds. Set while the account waits after using the daily replies. */
  bloqueadoHasta: number | null;
  /** The Colombian month the monthly count belongs to (YYYY-MM). */
  mes: string;
  usadasMes: number;
}

export interface UsageStatus {
  dayUsed: number;
  dayLimit: number;
  monthUsed: number;
  monthLimit: number;
  /** Set when no more replies are given right now, with when they are again. */
  blocked: { scope: "day" | "month"; resetAt: number } | null;
}

/**
 * The row as it stands at `now`: counts that belong to a past day or month start again from zero,
 * and a daily wait that is over gives the day's replies back. A wait that is still running keeps its count
 * even across midnight, so waiting through the night does not win replies back early.
 */
export function normalizeUsage(row: UsageRow | null, now: number): UsageRow {
  const dia = bogotaDay(now);
  const mes = bogotaMonth(now);
  let next: UsageRow = row ?? { dia, usadasDia: 0, bloqueadoHasta: null, mes, usadasMes: 0 };

  if (next.mes !== mes) next = { ...next, mes, usadasMes: 0 };

  if (next.bloqueadoHasta !== null && next.bloqueadoHasta <= now) {
    next = { ...next, dia, usadasDia: 0, bloqueadoHasta: null };
  } else if (next.bloqueadoHasta === null && next.dia !== dia) {
    next = { ...next, dia, usadasDia: 0 };
  }
  return next;
}

export function usageStatus(row: UsageRow | null, now: number): UsageStatus {
  const current = normalizeUsage(row, now);
  let blocked: UsageStatus["blocked"] = null;
  if (current.usadasMes >= MONTHLY_LIMIT) {
    blocked = { scope: "month", resetAt: nextMonthStart(now) };
  } else if (current.bloqueadoHasta !== null && current.bloqueadoHasta > now) {
    blocked = { scope: "day", resetAt: current.bloqueadoHasta };
  }
  return {
    dayUsed: current.usadasDia,
    dayLimit: DAILY_LIMIT,
    monthUsed: current.usadasMes,
    monthLimit: MONTHLY_LIMIT,
    blocked,
  };
}

/** The row after one more reply. The hundredth of the day starts the wait. */
export function withReply(row: UsageRow | null, now: number): UsageRow {
  const current = normalizeUsage(row, now);
  const usadasDia = current.usadasDia + 1;
  return {
    ...current,
    usadasDia,
    usadasMes: current.usadasMes + 1,
    bloqueadoHasta: current.bloqueadoHasta ?? (usadasDia >= DAILY_LIMIT ? now + DAILY_WAIT_MS : null),
  };
}

interface UsageRecord {
  dia: string;
  usadas_dia: number;
  bloqueado_ms: number | null;
  mes: string;
  usadas_mes: number;
}

export async function readUsage(personaId: string): Promise<UsageRow | null> {
  const rows = (await getSql()`
    select dia::text as dia, usadas_dia, (extract(epoch from bloqueado_hasta) * 1000)::float8 as bloqueado_ms, mes, usadas_mes
    from uso where persona_id = ${personaId}
  `) as UsageRecord[];
  const row = rows[0];
  if (!row) return null;
  return {
    dia: row.dia,
    usadasDia: row.usadas_dia,
    bloqueadoHasta: row.bloqueado_ms === null ? null : Math.round(row.bloqueado_ms),
    mes: row.mes,
    usadasMes: row.usadas_mes,
  };
}

export async function saveUsage(personaId: string, row: UsageRow): Promise<void> {
  const until = row.bloqueadoHasta === null ? null : new Date(row.bloqueadoHasta).toISOString();
  await getSql()`
    insert into uso (persona_id, dia, usadas_dia, bloqueado_hasta, mes, usadas_mes)
    values (${personaId}, ${row.dia}, ${row.usadasDia}, ${until}, ${row.mes}, ${row.usadasMes})
    on conflict (persona_id) do update set
      dia = excluded.dia,
      usadas_dia = excluded.usadas_dia,
      bloqueado_hasta = excluded.bloqueado_hasta,
      mes = excluded.mes,
      usadas_mes = excluded.usadas_mes
  `;
}
