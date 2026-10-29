import { getSql } from "@/lib/db";

export const CLINICAL_MEMORY_CATEGORIES = [
  "condition",
  "allergy",
  "medication",
  "surgery",
  "pregnancy",
  "other",
] as const;

export type ClinicalMemoryCategory = (typeof CLINICAL_MEMORY_CATEGORIES)[number];
export type ClinicalMemoryStatus = "active" | "resolved";

export interface ClinicalMemoryProposal {
  category: ClinicalMemoryCategory;
  value: string;
  details: Record<string, unknown>;
}

export interface ClinicalMemory extends ClinicalMemoryProposal {
  id: string;
  status: ClinicalMemoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalMemoryPatch {
  category?: ClinicalMemoryCategory;
  value?: string;
  details?: Record<string, unknown>;
  status?: ClinicalMemoryStatus;
}

interface MemoryRow {
  id: string;
  categoria: ClinicalMemoryCategory;
  valor: string;
  detalles: Record<string, unknown> | null;
  estado: ClinicalMemoryStatus;
  creado_en: string | Date;
  actualizado_en: string | Date;
}

function mapMemory(row: MemoryRow): ClinicalMemory {
  return {
    id: row.id,
    category: row.categoria,
    value: row.valor,
    details: row.detalles ?? {},
    status: row.estado,
    createdAt: new Date(row.creado_en).toISOString(),
    updatedAt: new Date(row.actualizado_en).toISOString(),
  };
}

export async function listClinicalMemory(personaId: string): Promise<ClinicalMemory[]> {
  const rows = (await getSql()`
    select id, categoria, valor, detalles, estado, creado_en, actualizado_en
    from memoria_clinica
    where persona_id = ${personaId}
    order by estado asc, actualizado_en desc
  `) as MemoryRow[];
  return rows.map(mapMemory);
}

export async function createClinicalMemory(
  personaId: string,
  input: ClinicalMemoryProposal,
): Promise<ClinicalMemory> {
  const rows = (await getSql()`
    insert into memoria_clinica (persona_id, categoria, valor, detalles, estado, origen, version_consentimiento)
    values (${personaId}, ${input.category}, ${input.value}, ${JSON.stringify(input.details)}::jsonb, 'active', 'user_confirmed', 'clinical-memory-v1')
    returning id, categoria, valor, detalles, estado, creado_en, actualizado_en
  `) as MemoryRow[];
  return mapMemory(rows[0]);
}

export async function updateClinicalMemory(
  personaId: string,
  id: string,
  patch: ClinicalMemoryPatch,
): Promise<ClinicalMemory | null> {
  const rows = (await getSql()`
    update memoria_clinica
    set
      categoria = coalesce(${patch.category ?? null}, categoria),
      valor = coalesce(${patch.value ?? null}, valor),
      detalles = coalesce(${patch.details === undefined ? null : JSON.stringify(patch.details)}::jsonb, detalles),
      estado = coalesce(${patch.status ?? null}, estado),
      actualizado_en = now()
    where id = ${id} and persona_id = ${personaId}
    returning id, categoria, valor, detalles, estado, creado_en, actualizado_en
  `) as MemoryRow[];
  return rows[0] ? mapMemory(rows[0]) : null;
}

export async function deleteClinicalMemory(personaId: string, id: string): Promise<boolean> {
  const rows = (await getSql()`
    delete from memoria_clinica where id = ${id} and persona_id = ${personaId} returning id
  `) as { id: string }[];
  return rows.length > 0;
}

export function formatClinicalMemory(records: ClinicalMemory[]): string | undefined {
  const active = records.filter((record) => record.status === "active");
  if (active.length === 0) return undefined;
  return active
    .map((record) => {
      const details = Object.entries(record.details)
        .slice(0, 8)
        .map(([key, value]) => {
          const rendered = typeof value === "string" ? value : JSON.stringify(value) ?? "";
          return `${key.replace(/\s+/g, " ").slice(0, 80)}: ${rendered.replace(/\s+/g, " ").slice(0, 200)}`;
        })
        .join(", ");
      return `- categoría: ${record.category}; dato confirmado: ${record.value}${details ? `; detalles: ${details}` : ""}`;
    })
    .join("\n");
}
