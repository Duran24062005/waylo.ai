/** The sections of the settings, in the order they are listed. Shared by the page (server) and the screen (client). */
export const SECTIONS = ["general", "appearance", "account", "live", "usage"] as const;
export type SectionId = (typeof SECTIONS)[number];

export function isSection(value: unknown): value is SectionId {
  return typeof value === "string" && (SECTIONS as readonly string[]).includes(value);
}
