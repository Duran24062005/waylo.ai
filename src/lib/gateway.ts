const DEFAULT_BASE_URL = "https://api.reto.pltk.mx/v1";

/** Settings for the reto gateway, or null when no key is configured. Server only. */
export function gatewayConfig(): { key: string; baseUrl: string } | null {
  const key = process.env.RETO_KEY;
  if (!key) return null;
  return { key, baseUrl: (process.env.RETO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "") };
}
