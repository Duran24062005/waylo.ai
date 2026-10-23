import { describe, expect, it } from "vitest";
import {
  applyEpsPatch,
  EMPTY_EPS_ROW,
  EPS_CODE_TTL_MS,
  epsPatchSchema,
  epsState,
  maskCedula,
  type EpsRow,
} from "@/lib/eps";

const NOW = Date.UTC(2026, 9, 23, 17, 0, 0);
// A stand-in for the encryption: readable in the tests, and clearly not the plain text.
const encrypt = (plain: string) => `enc(${plain})`;
const decrypt = (token: string | null) => (token?.startsWith("enc(") ? token.slice(4, -1) : null);

const authorized: EpsRow = { ...EMPTY_EPS_ROW, eps: "confianza", autorizaEn: NOW - 1000 };

describe("epsPatchSchema", () => {
  it("takes a field on its own, and null to clear it", () => {
    expect(epsPatchSchema.parse({ eps: "confianza" })).toEqual({ eps: "confianza" });
    expect(epsPatchSchema.parse({ eps: null, cedula: null, codigo: null })).toEqual({ eps: null, cedula: null, codigo: null });
    expect(epsPatchSchema.parse({ autoriza: true })).toEqual({ autoriza: true });
    expect(epsPatchSchema.parse({})).toEqual({});
  });

  it("takes only listed EPS", () => {
    for (const eps of ["sanitas", "", "Confianza", 1]) expect(epsPatchSchema.safeParse({ eps }).success, String(eps)).toBe(false);
  });

  it("takes an ID number of 5 to 12 digits and nothing else", () => {
    for (const cedula of ["12345", "1032456789", " 1032456789 ", "123456789012"]) {
      expect(epsPatchSchema.safeParse({ cedula }).success, cedula).toBe(true);
    }
    for (const cedula of ["1234", "1234567890123", "10.324.567", "10324a", "", "1032 4567", "-1032456"]) {
      expect(epsPatchSchema.safeParse({ cedula }).success, cedula).toBe(false);
    }
  });

  it("takes a code of exactly six digits", () => {
    for (const codigo of ["123456", "000000", " 654321 "]) {
      expect(epsPatchSchema.safeParse({ codigo }).success, codigo).toBe(true);
    }
    for (const codigo of ["12345", "1234567", "12 34 56", "12-3456", "12345a", "123456cd", "<script>", "", "código"]) {
      expect(epsPatchSchema.safeParse({ codigo }).success, codigo).toBe(false);
    }
  });

  it("takes the authorization only as true or false", () => {
    for (const autoriza of ["si", 1, null, "true"]) expect(epsPatchSchema.safeParse({ autoriza }).success, String(autoriza)).toBe(false);
  });

  it("rejects fields it does not know", () => {
    expect(epsPatchSchema.safeParse({ eps: "confianza", email: "a@b.co" }).success).toBe(false);
  });
});

describe("applyEpsPatch", () => {
  it("encrypts the ID number and the code, so the stored row never holds them in plain text", () => {
    const plan = applyEpsPatch(authorized, { cedula: "1032456789", codigo: "123456" }, NOW, encrypt);

    expect(plan.ok && plan.row.cedulaCifrada).toBe("enc(1032456789)");
    expect(plan.ok && plan.row.codigoCifrado).toBe("enc(123456)");
    expect(JSON.stringify(plan)).not.toMatch(/"(cedulaCifrada|codigoCifrado)":"[^e]/);
  });

  it("starts the clock of the code when it is saved", () => {
    const plan = applyEpsPatch(authorized, { codigo: "123456" }, NOW, encrypt);

    expect(plan.ok && plan.row.codigoExpira).toBe(NOW + EPS_CODE_TTL_MS);
    expect(EPS_CODE_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("refuses a code while the authorization is not given", () => {
    const plan = applyEpsPatch({ ...EMPTY_EPS_ROW, eps: "confianza" }, { codigo: "123456" }, NOW, encrypt);

    expect(plan).toEqual({ ok: false, error: "not_authorized" });
  });

  it("takes the code when the authorization comes in the same request", () => {
    const plan = applyEpsPatch(EMPTY_EPS_ROW, { autoriza: true, codigo: "123456" }, NOW, encrypt);

    expect(plan.ok && plan.row.autorizaEn).toBe(NOW);
    expect(plan.ok && plan.row.codigoCifrado).toBe("enc(123456)");
  });

  it("remembers when the authorization was first given, and does not move it", () => {
    const first = applyEpsPatch(EMPTY_EPS_ROW, { autoriza: true }, NOW, encrypt);
    const again = applyEpsPatch(first.ok ? first.row : EMPTY_EPS_ROW, { autoriza: true }, NOW + 5000, encrypt);

    expect(again.ok && again.row.autorizaEn).toBe(NOW);
  });

  it("deletes the code when the authorization is taken back, so nothing is left that could act", () => {
    const withCode: EpsRow = { ...authorized, codigoCifrado: "enc(123456)", codigoExpira: NOW + 1000 };

    const plan = applyEpsPatch(withCode, { autoriza: false }, NOW, encrypt);

    expect(plan.ok && plan.row).toMatchObject({ autorizaEn: null, codigoCifrado: null, codigoExpira: null });
    // The rest stays, since the person did not ask to lose it.
    expect(plan.ok && plan.row.eps).toBe("confianza");
  });

  it("clears each field on its own when null comes in", () => {
    const full: EpsRow = { eps: "confianza", cedulaCifrada: "enc(1032456789)", codigoCifrado: "enc(123456)", codigoExpira: NOW + 1000, autorizaEn: NOW };

    expect(applyEpsPatch(full, { cedula: null }, NOW, encrypt)).toMatchObject({ row: { cedulaCifrada: null, codigoCifrado: "enc(123456)" } });
    expect(applyEpsPatch(full, { codigo: null }, NOW, encrypt)).toMatchObject({ row: { codigoCifrado: null, codigoExpira: null, cedulaCifrada: "enc(1032456789)" } });
    expect(applyEpsPatch(full, { eps: null }, NOW, encrypt)).toMatchObject({ row: { eps: null } });
  });

  it("does not touch the row it was given", () => {
    const row: EpsRow = { ...authorized };
    applyEpsPatch(row, { cedula: "1032456789" }, NOW, encrypt);
    expect(row).toEqual(authorized);
  });
});

describe("maskCedula", () => {
  it("hides all but the last digits", () => {
    expect(maskCedula("1032456789")).toBe("••••••6789");
    expect(maskCedula("12345678")).toBe("••••5678");
    expect(maskCedula("123456")).toBe("••••56");
  });
});

describe("epsState", () => {
  const full: EpsRow = { eps: "confianza", cedulaCifrada: "enc(1032456789)", codigoCifrado: "enc(123456)", codigoExpira: NOW + 60_000, autorizaEn: NOW };

  it("gives the bot access only with the authorization, the EPS, the ID number and a code that has not expired", () => {
    expect(epsState(full, NOW, decrypt)).toEqual({
      eps: "confianza",
      cedula: "••••••6789",
      codigoVenceEn: NOW + 60_000,
      autorizado: true,
      acceso: true,
    });

    for (const missing of [
      { autorizaEn: null },
      { eps: null },
      { cedulaCifrada: null },
      { codigoCifrado: null },
      { codigoExpira: NOW - 1 },
      { codigoExpira: NOW },
    ] as Partial<EpsRow>[]) {
      expect(epsState({ ...full, ...missing }, NOW, decrypt).acceso, JSON.stringify(missing)).toBe(false);
    }
  });

  it("never carries the ID number or the code, and says no code is on file once it expired", () => {
    const state = epsState({ ...full, codigoExpira: NOW - 1 }, NOW, decrypt);

    expect(state.codigoVenceEn).toBeNull();
    expect(JSON.stringify(state)).not.toContain("1032456789");
    expect(JSON.stringify(state)).not.toContain("123456");
  });

  it("ignores an EPS that is not on the list, and an ID number that cannot be read", () => {
    const state = epsState({ ...full, eps: "otra", cedulaCifrada: "cifrado-roto" }, NOW, decrypt);

    expect(state.eps).toBeNull();
    expect(state.cedula).toBeNull();
    expect(state.acceso).toBe(false);
  });
});
