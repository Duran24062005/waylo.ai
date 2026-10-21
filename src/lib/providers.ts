import providersData from "@/data/providers.json";
import type { AttentionType, CareLevel, ProviderSite } from "@/lib/types";

const providers = providersData as ProviderSite[];

const LEVEL_TO_TYPE: Record<CareLevel, AttentionType> = {
  urgencias: "Urgencias 24h",
  prioritaria: "Prioritaria",
  general: "Externa",
};

export function listProviders(): ProviderSite[] {
  return providers;
}

export function findProviders(level: CareLevel, eps?: string, limit = 2): ProviderSite[] {
  const type = LEVEL_TO_TYPE[level];
  const epsKey = eps?.trim().toLowerCase();

  const matching = providers.filter((site) => site.tipo_atencion.includes(type));

  const ranked = [...matching].sort((a, b) => {
    if (!epsKey) return 0;
    const aHit = a.eps_convenio.some((item) => item.toLowerCase() === epsKey) ? 1 : 0;
    const bHit = b.eps_convenio.some((item) => item.toLowerCase() === epsKey) ? 1 : 0;
    return bHit - aHit;
  });

  return ranked.slice(0, limit);
}
