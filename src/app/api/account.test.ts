import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const verifyPassword = vi.fn();
const updateProfile = vi.fn();
const closeSession = vi.fn();
const closeOtherSessions = vi.fn();
const endSession = vi.fn();
const sqlResults: (unknown[] | Error)[] = [];
const sqlCalls: { text: string; values: unknown[] }[] = [];
const cookieWrites: Record<string, string> = {};

// A tagged-template stand-in for the database: it records what was asked and answers from a queue.
function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  sqlCalls.push({ text: strings.join("?"), values });
  const next = sqlResults.shift();
  if (next instanceof Error) return Promise.reject(next);
  return Promise.resolve(next ?? []);
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (name: string, value: string) => {
      cookieWrites[name] = value;
    },
  }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("@/lib/db", () => ({ getSql: () => sql }));
vi.mock("@/lib/session", () => ({ getSession: () => getSession(), endSession: () => endSession() }));
vi.mock("@/lib/password", () => ({ verifyPassword: (...args: unknown[]) => verifyPassword(...args) }));
vi.mock("@/lib/profile-db", () => ({
  updateProfile: (...args: unknown[]) => updateProfile(...args),
  closeSession: (...args: unknown[]) => closeSession(...args),
  closeOtherSessions: (...args: unknown[]) => closeOtherSessions(...args),
}));

import { DELETE as deleteAccount } from "@/app/api/cuenta/route";
import { PATCH as patchEmail } from "@/app/api/perfil/correo/route";
import { PATCH as patchProfile } from "@/app/api/perfil/route";
import { PATCH as patchPreferences } from "@/app/api/preferencias/route";
import { DELETE as closeOthers } from "@/app/api/sesiones/route";
import { DELETE as closeOne } from "@/app/api/sesiones/[id]/route";

const SESSION = { id: "u1", nombre: "Ana Pérez", apodo: null, sid: "11111111-1111-4111-8111-111111111111" };
const OTHER_SID = "22222222-2222-4222-8222-222222222222";

const patch = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  for (const key of Object.keys(cookieWrites)) delete cookieWrites[key];
  sqlResults.length = 0;
  sqlCalls.length = 0;
  getSession.mockReset().mockResolvedValue(SESSION);
  verifyPassword.mockReset().mockResolvedValue(true);
  updateProfile.mockReset().mockResolvedValue(undefined);
  closeSession.mockReset().mockResolvedValue(true);
  closeOtherSessions.mockReset().mockResolvedValue(2);
  endSession.mockReset().mockResolvedValue(undefined);
});

describe("PATCH /api/preferencias", () => {
  it("remembers the choices on this device and saves them on the account", async () => {
    const response = await patchPreferences(patch("/api/preferencias", { idioma: "en", voz: "masculino" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, saved: true });
    expect(cookieWrites).toEqual({ waylo_lang: "en", waylo_voice: "masculino" });
    expect(sqlCalls.map((call) => call.values)).toEqual([["en", "u1"], ["masculino", "u1"]]);
  });

  it("takes \"auto\" as a language: the cookie is cleared so the app follows the browser, and the account keeps the choice", async () => {
    const response = await patchPreferences(patch("/api/preferencias", { idioma: "auto" }));

    expect(response.status).toBe(200);
    expect(cookieWrites).toEqual({ waylo_lang: "" });
    expect(sqlCalls.map((call) => call.values)).toEqual([["auto", "u1"]]);
  });

  it("has no separate language for the voice any more: it is the same one", async () => {
    const response = await patchPreferences(patch("/api/preferencias", { idiomaLive: "en" }));

    expect(response.status).toBe(400);
    expect(cookieWrites).toEqual({});
  });

  it("changes only what was sent", async () => {
    await patchPreferences(patch("/api/preferencias", { voz: "femenino" }));

    expect(cookieWrites).toEqual({ waylo_voice: "femenino" });
    expect(sqlCalls).toHaveLength(1);
  });

  it("works for a visitor without an account, keeping the choice only on this device", async () => {
    getSession.mockResolvedValue(null);

    const response = await patchPreferences(patch("/api/preferencias", { idioma: "pt" }));

    expect(await response.json()).toEqual({ ok: true, saved: false });
    expect(cookieWrites).toEqual({ waylo_lang: "pt" });
    expect(sqlCalls).toHaveLength(0);
  });

  it("rejects a language, voice or Live language that does not exist, and anything else sent along", async () => {
    for (const body of [
      { idioma: "fr" },
      { voz: "robot" },
      { idiomaLive: "de" },
      { idioma: "en", email: "a@b.co" },
      { idioma: 5 },
      "texto",
      null,
    ]) {
      const response = await patchPreferences(patch("/api/preferencias", body));
      expect(response.status, JSON.stringify(body)).toBe(400);
    }
    expect(cookieWrites).toEqual({});
    expect(sqlCalls).toHaveLength(0);
  });

  it("still applies the choice on this device when the account cannot be updated", async () => {
    sqlResults.push(new Error("db down"));

    const response = await patchPreferences(patch("/api/preferencias", { idioma: "en" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, saved: false });
    expect(cookieWrites).toEqual({ waylo_lang: "en" });
  });
});

describe("PATCH /api/perfil", () => {
  it("answers 401 without a session, and writes nothing", async () => {
    getSession.mockResolvedValue(null);

    const response = await patchProfile(patch("/api/perfil", { nombre: "Ana" }));

    expect(response.status).toBe(401);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("saves the fields it is given on the signed-in account", async () => {
    const response = await patchProfile(
      patch("/api/perfil", { nombre: " Ana María ", apodo: "", sexo: "femenino", ciudad: "Cali, Valle del Cauca", nacionalidad: "CO" }),
    );

    expect(response.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith("u1", {
      nombre: "Ana María",
      apodo: null,
      sexo: "femenino",
      ciudad: "Cali, Valle del Cauca",
      nacionalidad: "CO",
    });
  });

  it("answers 400 with the field that is wrong, and writes nothing", async () => {
    for (const [body, campo] of [
      [{ nombre: "" }, "nombre"],
      [{ sexo: "x" }, "sexo"],
      [{ ciudad: "Narnia" }, "ciudad"],
      [{ nacionalidad: "ZZ" }, "nacionalidad"],
    ] as const) {
      const response = await patchProfile(patch("/api/perfil", body));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid", campo });
    }
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("does not let the account's email, password or id be set through it", async () => {
    for (const body of [{ email: "a@b.co" }, { password_hash: "x" }, { id: "u2" }]) {
      expect((await patchProfile(patch("/api/perfil", body))).status).toBe(400);
    }
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("answers 500 when the database fails", async () => {
    updateProfile.mockRejectedValue(new Error("db down"));
    expect((await patchProfile(patch("/api/perfil", { nombre: "Ana" }))).status).toBe(500);
  });
});

describe("PATCH /api/perfil/correo", () => {
  const change = { email: "Nueva@Correo.com", password: "secreta123" };

  it("answers 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await patchEmail(patch("/api/perfil/correo", change))).status).toBe(401);
    expect(sqlCalls).toHaveLength(0);
  });

  it("changes the email, lowercased, once the current password is right", async () => {
    sqlResults.push([{ password_hash: "hash" }], []);

    const response = await patchEmail(patch("/api/perfil/correo", change));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, email: "nueva@correo.com" });
    expect(verifyPassword).toHaveBeenCalledWith("secreta123", "hash");
    expect(sqlCalls[1].values).toEqual(["nueva@correo.com", "u1"]);
  });

  it("does not change it with a wrong password", async () => {
    sqlResults.push([{ password_hash: "hash" }]);
    verifyPassword.mockResolvedValue(false);

    const response = await patchEmail(patch("/api/perfil/correo", change));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: "wrong_password" });
    expect(sqlCalls).toHaveLength(1);
  });

  it("does not change the email of an account made with Google, which has no password here", async () => {
    sqlResults.push([{ password_hash: null }]);

    const response = await patchEmail(patch("/api/perfil/correo", change));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "no_password" });
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("answers 409 when another account already uses that address", async () => {
    sqlResults.push([{ password_hash: "hash" }], Object.assign(new Error("duplicate"), { code: "23505" }));

    const response = await patchEmail(patch("/api/perfil/correo", change));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "email_taken" });
  });

  it("rejects a malformed address without touching the database", async () => {
    const response = await patchEmail(patch("/api/perfil/correo", { email: "no-es-un-correo", password: "x" }));

    expect(response.status).toBe(400);
    expect(sqlCalls).toHaveLength(0);
  });
});

describe("DELETE /api/sesiones", () => {
  it("closes the account's other sessions and keeps this one", async () => {
    const response = await closeOthers();

    expect(await response.json()).toEqual({ ok: true, closed: 2 });
    expect(closeOtherSessions).toHaveBeenCalledWith("u1", SESSION.sid);
  });

  it("answers 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await closeOthers()).status).toBe(401);
    expect(closeOtherSessions).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/sesiones/[id]", () => {
  const call = (id: string) => closeOne(new Request(`http://localhost/api/sesiones/${id}`), { params: Promise.resolve({ id }) });

  it("closes one of the account's other sessions", async () => {
    const response = await call(OTHER_SID);

    expect(response.status).toBe(200);
    expect(closeSession).toHaveBeenCalledWith("u1", OTHER_SID);
  });

  it("does not close this device's own session here: that is signing out", async () => {
    const response = await call(SESSION.sid);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "current" });
    expect(closeSession).not.toHaveBeenCalled();
  });

  it("only sends a well-formed id to the database", async () => {
    for (const id of ["1", "abc", "'; drop table sesiones; --", "../etc/passwd"]) {
      expect((await call(id)).status, id).toBe(400);
    }
    expect(closeSession).not.toHaveBeenCalled();
  });

  it("answers 404 for a session that is not this account's", async () => {
    closeSession.mockResolvedValue(false);
    expect((await call(OTHER_SID)).status).toBe(404);
  });

  it("answers 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await call(OTHER_SID)).status).toBe(401);
  });
});

describe("DELETE /api/cuenta", () => {
  const remove = (body: unknown) =>
    deleteAccount(
      new Request("http://localhost/api/cuenta", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  const deleted = () => sqlCalls.some((call) => call.text.includes("delete from personas"));

  it("answers 401 without a session, and deletes nothing", async () => {
    getSession.mockResolvedValue(null);

    expect((await remove({ password: "x" })).status).toBe(401);
    expect(sqlCalls).toHaveLength(0);
  });

  it("deletes the account and ends the session once the password is right", async () => {
    sqlResults.push([{ email: "ana@correo.com", password_hash: "hash" }], []);

    const response = await remove({ password: "secreta123" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, id: "u1" });
    expect(verifyPassword).toHaveBeenCalledWith("secreta123", "hash");
    expect(deleted()).toBe(true);
    expect(sqlCalls[1].values).toEqual(["u1"]);
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("does not delete anything with a wrong or missing password", async () => {
    sqlResults.push([{ email: "ana@correo.com", password_hash: "hash" }]);
    verifyPassword.mockResolvedValue(false);
    const wrong = await remove({ password: "equivocada" });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "wrong_password" });

    sqlResults.push([{ email: "ana@correo.com", password_hash: "hash" }]);
    expect((await remove({})).status).toBe(401);

    expect(deleted()).toBe(false);
    expect(endSession).not.toHaveBeenCalled();
  });

  it("asks an account made with Google for its email, since it has no password here", async () => {
    sqlResults.push([{ email: "Ana@Gmail.com", password_hash: null }], []);

    const response = await remove({ email: "  ana@gmail.com " });

    expect(response.status).toBe(200);
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(deleted()).toBe(true);
  });

  it("does not delete a Google account when the email typed is not its own", async () => {
    sqlResults.push([{ email: "ana@gmail.com", password_hash: null }]);

    const response = await remove({ email: "otra@gmail.com" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "mismatch" });
    expect(deleted()).toBe(false);
  });

  it("does not accept a password in place of the email for a Google account, or the other way round", async () => {
    sqlResults.push([{ email: "ana@gmail.com", password_hash: null }]);
    expect((await remove({ password: "ana@gmail.com" })).status).toBe(400);

    sqlResults.push([{ email: "ana@correo.com", password_hash: "hash" }]);
    verifyPassword.mockResolvedValue(false);
    expect((await remove({ email: "ana@correo.com" })).status).toBe(401);
    expect(deleted()).toBe(false);
  });

  it("answers 500 when the database fails, and keeps the session", async () => {
    sqlResults.push(new Error("db down"));

    expect((await remove({ password: "x" })).status).toBe(500);
    expect(endSession).not.toHaveBeenCalled();
  });
});
