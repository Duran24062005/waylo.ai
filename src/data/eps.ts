/** The EPS a person can pick. Only Confianza for now: a made-up insurer used for demos and tests. */
export const EPS_IDS = ["confianza"] as const;
export type EpsId = (typeof EPS_IDS)[number];

export const EPS_NAMES: Record<EpsId, string> = { confianza: "Confianza" };

/** Where the bot works for each EPS, once it has the person's authorization and a code. */
export const EPS_SITES: Record<EpsId, string> = { confianza: "https://confianza-ips-frontend.vercel.app/" };

export function isEpsId(value: unknown): value is EpsId {
  return typeof value === "string" && (EPS_IDS as readonly string[]).includes(value);
}
