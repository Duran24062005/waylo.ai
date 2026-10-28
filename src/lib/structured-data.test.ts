import { describe, expect, it } from "vitest";
import { homeStructuredData, toJsonLd } from "@/lib/structured-data";

describe("home structured data", () => {
  it("describes the organization and the website, linked to each other", () => {
    const data = homeStructuredData({ description: "Orientación", language: "es" });
    const [organization, website] = data["@graph"];
    expect(organization["@type"]).toBe("Organization");
    expect(website["@type"]).toBe("WebSite");
    expect((website as { publisher?: { "@id": string } }).publisher?.["@id"]).toBe(organization["@id"]);
    expect((website as { inLanguage?: string }).inLanguage).toBe("es");
  });

  it("escapes < so the data cannot close the script tag", () => {
    const json = toJsonLd({ description: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json).description).toBe("</script><script>alert(1)</script>");
  });
});
