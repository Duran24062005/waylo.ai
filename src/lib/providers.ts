import providersData from "@/data/providers.json";
import type { Locale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";
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

/** A site's opening hours, written in a language ("7:00 a 17:00, lunes a viernes" → "7:00 to 17:00, Monday to Friday"). */
export function localizeSchedule(horario: string, locale: Locale): string {
  const words = messages[locale].server.schedule;
  return horario
    .replace(/\b24 horas\b/i, words.hours24)
    .replace(/\blunes\b/g, words.monday)
    .replace(/\bviernes\b/g, words.friday)
    .replace(/\bsábado\b/g, words.saturday)
    .replace(/(\d{1,2}:\d{2}) a (\d{1,2}:\d{2})/g, `$1 ${words.to} $2`)
    .replace(/(\p{L}) a (\p{L})/gu, `$1 ${words.toDays} $2`);
}

/** A site with the text of its data (requirements, hours) in a language. Names, addresses and phones stay as they are. */
export function localizeSite(site: ProviderSite, locale: Locale): ProviderSite {
  const requirements = messages[locale].server.requirements;
  return {
    ...site,
    requisitos: site.requisitos.map((item) => requirements[item] ?? item),
    horario: localizeSchedule(site.horario, locale),
  };
}

export function findProviders(level: CareLevel, eps?: string, limit = 2, locale: Locale = "es"): ProviderSite[] {
  const type = LEVEL_TO_TYPE[level];
  const epsKey = eps?.trim().toLowerCase();

  const matching = providers.filter((site) => site.tipo_atencion.includes(type));

  const ranked = [...matching].sort((a, b) => {
    if (!epsKey) return 0;
    const aHit = a.eps_convenio.some((item) => item.toLowerCase() === epsKey) ? 1 : 0;
    const bHit = b.eps_convenio.some((item) => item.toLowerCase() === epsKey) ? 1 : 0;
    return bHit - aHit;
  });

  return ranked.slice(0, limit).map((site) => localizeSite(site, locale));
}
