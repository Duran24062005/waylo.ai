/** The sections of the settings, in the order they are listed. */
export const SECTIONS = ["general", "appearance", "live", "account", "eps", "security", "usage"] as const;
export type SectionId = (typeof SECTIONS)[number];

export function isSection(value: unknown): value is SectionId {
  return typeof value === "string" && (SECTIONS as readonly string[]).includes(value);
}

/** The list on the left is split in two: how the app works for the person, and the person's account. */
export const GROUPS: readonly { id: "preferences" | "account"; sections: readonly SectionId[] }[] = [
  { id: "preferences", sections: ["general", "appearance", "live"] },
  { id: "account", sections: ["account", "eps", "security", "usage"] },
];
