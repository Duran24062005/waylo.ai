/** What a failed attempt to connect with the IPS means for the person, whatever the layer that raised it. */
export type IpsLinkProblem = "invalid" | "requirements" | "service" | "other";

// Codes from the integration backend (upper case) and from this app's own client (lower case).
const SERVICE_CODES = new Set([
  "INTEGRATION_UNAVAILABLE",
  "IPS_UNAVAILABLE",
  "integration_unconfigured",
  "backend_unavailable",
  "ips_unavailable",
]);

export function ipsLinkProblem(code: unknown): IpsLinkProblem {
  if (typeof code !== "string") return "other";
  if (code === "LINK_INVALID") return "invalid";
  if (code === "CEDULA_REQUIRED" || code === "invalid") return "requirements";
  if (SERVICE_CODES.has(code)) return "service";
  return "other";
}
