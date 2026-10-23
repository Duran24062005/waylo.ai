import { getSql } from "@/lib/db";
import { applyEpsPatch, EMPTY_EPS_ROW, epsState, type EpsPatch, type EpsRow, type EpsState } from "@/lib/eps";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

interface EpsRecord {
  eps: string | null;
  eps_cedula_cifrada: string | null;
  eps_codigo_cifrado: string | null;
  codigo_expira_ms: number | null;
  autoriza_ms: number | null;
}

async function readRow(personaId: string): Promise<EpsRow> {
  const rows = (await getSql()`
    select eps, eps_cedula_cifrada, eps_codigo_cifrado,
      (extract(epoch from eps_codigo_expira) * 1000)::float8 as codigo_expira_ms,
      (extract(epoch from eps_autoriza_en) * 1000)::float8 as autoriza_ms
    from personas where id = ${personaId}
  `) as EpsRecord[];
  const row = rows[0];
  if (!row) return EMPTY_EPS_ROW;
  return {
    eps: row.eps,
    cedulaCifrada: row.eps_cedula_cifrada,
    codigoCifrado: row.eps_codigo_cifrado,
    codigoExpira: row.codigo_expira_ms === null ? null : Math.round(row.codigo_expira_ms),
    autorizaEn: row.autoriza_ms === null ? null : Math.round(row.autoriza_ms),
  };
}

export async function getEpsState(personaId: string, now: number): Promise<EpsState> {
  return epsState(await readRow(personaId), now, decryptSecret);
}

/** Saves a change under the rules of applyEpsPatch. Returns the new state, or the reason it was refused. */
export async function saveEps(
  personaId: string,
  patch: EpsPatch,
  now: number,
): Promise<{ ok: true; state: EpsState } | { ok: false; error: "not_authorized" }> {
  const plan = applyEpsPatch(await readRow(personaId), patch, now, encryptSecret);
  if (!plan.ok) return plan;

  const { row } = plan;
  const expires = row.codigoExpira === null ? null : new Date(row.codigoExpira).toISOString();
  const authorized = row.autorizaEn === null ? null : new Date(row.autorizaEn).toISOString();
  await getSql()`
    update personas set
      eps = ${row.eps},
      eps_cedula_cifrada = ${row.cedulaCifrada},
      eps_codigo_cifrado = ${row.codigoCifrado},
      eps_codigo_expira = ${expires},
      eps_autoriza_en = ${authorized}
    where id = ${personaId}
  `;
  return { ok: true, state: epsState(row, now, decryptSecret) };
}
