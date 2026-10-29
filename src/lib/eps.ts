import { z } from "zod";
import { EPS_IDS, type EpsId, isEpsId } from "@/data/eps";

/** An ID number: digits only, as long as Colombian ones go. */
export const CEDULA_PATTERN = /^\d{5,12}$/;
/** The temporary code an insurer sends: six digits. */
export const CODE_LENGTH = 6;
export const CODE_PATTERN = /^\d{6}$/;
/** How long a temporary code stays on file. Codes from an insurer are short-lived, so Waylo does not keep them for long. */
export const EPS_CODE_TTL_MS = 30 * 60 * 1000;

/** Each field can be sent on its own, and null clears it. */
export const epsPatchSchema = z
  .object({
    eps: z.union([z.enum(EPS_IDS), z.null()]),
    cedula: z.union([z.string().trim().regex(CEDULA_PATTERN), z.null()]),
    codigo: z.union([z.string().trim().regex(CODE_PATTERN), z.null()]),
    autoriza: z.boolean(),
  })
  .partial()
  .strict();

export type EpsPatch = z.infer<typeof epsPatchSchema>;

/** What is stored: the secrets already encrypted, the times in epoch milliseconds. */
export interface EpsRow {
  eps: string | null;
  cedulaCifrada: string | null;
  codigoCifrado: string | null;
  codigoExpira: number | null;
  autorizaEn: number | null;
}

export const EMPTY_EPS_ROW: EpsRow = {
  eps: null,
  cedulaCifrada: null,
  codigoCifrado: null,
  codigoExpira: null,
  autorizaEn: null,
};

/** What the settings window gets. The ID number is masked and the code is never sent back. */
export interface EpsState {
  eps: EpsId | null;
  /** The ID number with all but its last digits hidden, or null when none is saved. */
  cedula: string | null;
  /** When the code on file expires (epoch ms). Null when there is none, or it already expired. */
  codigoVenceEn: number | null;
  autorizado: boolean;
  /** The bot can act: authorized, with an EPS, an ID number and a code that has not expired. */
  acceso: boolean;
}

export type EpsPlan = { ok: true; row: EpsRow } | { ok: false; error: "not_authorized" };

/**
 * The row after a change. The rules:
 * - A code can only be saved while the authorization is given.
 * - Taking the authorization back also deletes the code, so nothing is left that could act for the person.
 */
export function applyEpsPatch(row: EpsRow, patch: EpsPatch, now: number, encrypt: (plain: string) => string): EpsPlan {
  const next: EpsRow = { ...row };

  if (patch.autoriza === true && next.autorizaEn === null) next.autorizaEn = now;
  if (patch.autoriza === false) {
    next.autorizaEn = null;
    next.codigoCifrado = null;
    next.codigoExpira = null;
  }

  if (patch.eps !== undefined) next.eps = patch.eps;
  if (patch.cedula !== undefined) next.cedulaCifrada = patch.cedula === null ? null : encrypt(patch.cedula);

  if (patch.codigo !== undefined) {
    if (patch.codigo === null) {
      next.codigoCifrado = null;
      next.codigoExpira = null;
    } else {
      if (next.autorizaEn === null) return { ok: false, error: "not_authorized" };
      next.codigoCifrado = encrypt(patch.codigo);
      next.codigoExpira = now + EPS_CODE_TTL_MS;
    }
  }
  return { ok: true, row: next };
}

/** The last digits of an ID number, the rest hidden. */
export function maskCedula(cedula: string): string {
  const shown = cedula.length >= 8 ? 4 : 2;
  return `${"•".repeat(Math.max(0, cedula.length - shown))}${cedula.slice(-shown)}`;
}

export function epsState(row: EpsRow, now: number, decrypt: (token: string | null) => string | null): EpsState {
  const cedula = decrypt(row.cedulaCifrada);
  const codigoActivo = row.codigoCifrado !== null && row.codigoExpira !== null && row.codigoExpira > now;
  const eps = isEpsId(row.eps) ? row.eps : null;
  const autorizado = row.autorizaEn !== null;
  return {
    eps,
    cedula: cedula ? maskCedula(cedula) : null,
    codigoVenceEn: codigoActivo ? row.codigoExpira : null,
    autorizado,
    acceso: autorizado && eps !== null && cedula !== null && codigoActivo,
  };
}

/**
 * Whether "Connect" can be pressed: the person authorized the bot, chose Confianza, has an ID number and typed the six-digit code.
 * The ID number counts when a valid one is typed or, with nothing typed, when one is already saved: it comes back masked,
 * so the page cannot test it, but the server has it.
 */
export function canLinkIps(input: {
  autorizado: boolean;
  eps: string | null;
  cedulaSaved: boolean;
  typedCedula: string;
  code: string;
}): boolean {
  const typed = input.typedCedula.trim();
  const cedulaReady = typed ? CEDULA_PATTERN.test(typed) : input.cedulaSaved;
  return input.autorizado && input.eps === "confianza" && cedulaReady && CODE_PATTERN.test(input.code);
}
