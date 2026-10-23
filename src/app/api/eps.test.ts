import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const saveEps = vi.fn();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/eps-db", () => ({ saveEps: (...args: unknown[]) => saveEps(...args) }));

import { PATCH } from "@/app/api/eps/route";

const STATE = { eps: "confianza", cedula: "••••••6789", codigoVenceEn: null, autorizado: true, acceso: false };

const patch = (body: unknown) =>
  PATCH(
    new Request("http://localhost/api/eps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ id: "u1", nombre: "Ana", apodo: null, sid: "s1" });
  saveEps.mockReset().mockResolvedValue({ ok: true, state: STATE });
});

describe("PATCH /api/eps", () => {
  it("answers 401 without a session, and saves nothing", async () => {
    getSession.mockResolvedValue(null);

    expect((await patch({ eps: "confianza" })).status).toBe(401);
    expect(saveEps).not.toHaveBeenCalled();
  });

  it("saves what it is given for the signed-in account and answers with the new state", async () => {
    const response = await patch({ eps: "confianza", cedula: " 1032456789 ", autoriza: true });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, eps: STATE });
    expect(saveEps).toHaveBeenCalledWith("u1", { eps: "confianza", cedula: "1032456789", autoriza: true }, expect.any(Number));
  });

  it("never sends the ID number or the code back, only the masked state", async () => {
    const body = JSON.stringify(await (await patch({ cedula: "1032456789", codigo: "123456" })).json());

    expect(body).not.toContain("1032456789");
    expect(body).not.toContain("123456");
  });

  it("answers 400 with the field that is wrong, and saves nothing", async () => {
    for (const [body, campo] of [
      [{ eps: "sanitas" }, "eps"],
      [{ cedula: "12ab" }, "cedula"],
      [{ codigo: "12345" }, "codigo"],
      [{ autoriza: "si" }, "autoriza"],
    ] as const) {
      const response = await patch(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid", campo });
    }
    expect(saveEps).not.toHaveBeenCalled();
  });

  it("does not accept anything else of the account through it", async () => {
    for (const body of [{ email: "a@b.co" }, { password_hash: "x" }, { id: "u2" }, "texto", null]) {
      expect((await patch(body)).status, JSON.stringify(body)).toBe(400);
    }
    expect(saveEps).not.toHaveBeenCalled();
  });

  it("answers 403 for a code saved without the authorization", async () => {
    saveEps.mockResolvedValue({ ok: false, error: "not_authorized" });

    const response = await patch({ codigo: "123456" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "not_authorized" });
  });

  it("answers 500 when the database fails", async () => {
    saveEps.mockRejectedValue(new Error("db down"));
    expect((await patch({ eps: "confianza" })).status).toBe(500);
  });
});
