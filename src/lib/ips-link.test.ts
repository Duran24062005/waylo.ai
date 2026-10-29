import { describe, expect, it } from "vitest";
import { canLinkIps } from "@/lib/eps";
import { ipsLinkProblem } from "@/lib/ips-errors";

const ready = { autorizado: true, eps: "confianza", cedulaSaved: true, typedCedula: "", code: "859921" };

describe("canLinkIps", () => {
  it("allows connecting with the ID number already saved and nothing typed (the saved, masked case)", () => {
    expect(canLinkIps(ready)).toBe(true);
  });

  it("allows a valid number that is typed and not saved yet", () => {
    expect(canLinkIps({ ...ready, cedulaSaved: false, typedCedula: " 1032456789 " })).toBe(true);
  });

  it("needs an ID number: none saved and none typed", () => {
    expect(canLinkIps({ ...ready, cedulaSaved: false })).toBe(false);
  });

  it("does not trust a typed number that is not valid, even if another one is saved", () => {
    expect(canLinkIps({ ...ready, typedCedula: "123" })).toBe(false);
  });

  it("needs the authorization, Confianza and a six-digit code", () => {
    expect(canLinkIps({ ...ready, autorizado: false })).toBe(false);
    expect(canLinkIps({ ...ready, eps: "sanitas" })).toBe(false);
    expect(canLinkIps({ ...ready, eps: null })).toBe(false);
    expect(canLinkIps({ ...ready, code: "85992" })).toBe(false);
    expect(canLinkIps({ ...ready, code: "" })).toBe(false);
  });
});

describe("ipsLinkProblem", () => {
  it("tells a wrong code from a service that is down", () => {
    expect(ipsLinkProblem("LINK_INVALID")).toBe("invalid");
    for (const code of ["INTEGRATION_UNAVAILABLE", "IPS_UNAVAILABLE", "integration_unconfigured", "backend_unavailable", "ips_unavailable"]) {
      expect(ipsLinkProblem(code)).toBe("service");
    }
  });

  it("sends missing data back to the requirements message", () => {
    expect(ipsLinkProblem("CEDULA_REQUIRED")).toBe("requirements");
    expect(ipsLinkProblem("invalid")).toBe("requirements");
  });

  it("keeps anything else as a general failure", () => {
    expect(ipsLinkProblem("LINK_EXISTS")).toBe("other");
    expect(ipsLinkProblem(undefined)).toBe("other");
    expect(ipsLinkProblem(500)).toBe("other");
  });
});
