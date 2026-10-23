import { describe, expect, it } from "vitest";
import { GROUPS, isSection, SECTIONS } from "@/components/settings/sections";

describe("settings sections", () => {
  it("are the seven the settings window lists, each in exactly one group", () => {
    expect([...SECTIONS].sort()).toEqual(["account", "appearance", "eps", "general", "live", "security", "usage"]);
    const listed = GROUPS.flatMap((group) => group.sections);
    expect([...listed].sort()).toEqual([...SECTIONS].sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("keep the preferences apart from the account, with the profile first, then EPS, security and usage", () => {
    expect(GROUPS.map((group) => group.id)).toEqual(["preferences", "account"]);
    expect(GROUPS[0].sections).toEqual(["general", "appearance", "live"]);
    expect(GROUPS[1].sections).toEqual(["account", "eps", "security", "usage"]);
  });

  it("accepts only a section that exists, so a link cannot open anything else", () => {
    expect(isSection("usage")).toBe(true);
    expect(isSection("account")).toBe(true);
    for (const value of ["perfil", "", "USAGE", undefined, null, 3, "usage "]) {
      expect(isSection(value), String(value)).toBe(false);
    }
  });
});
