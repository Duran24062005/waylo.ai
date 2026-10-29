import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar: Record<string, string> = {};
const runTriage = vi.fn();
const getSession = vi.fn();
const getIpsLink = vi.fn();
const listClinicalMemory = vi.fn();
const formatClinicalMemory = vi.fn();
const readUsage = vi.fn();
const saveUsage = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/ips-backend", () => ({
  getIpsLink: (id: string) => getIpsLink(id),
}));
vi.mock("@/lib/clinical-memory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/clinical-memory")>()),
  listClinicalMemory: (id: string) => listClinicalMemory(id),
  formatClinicalMemory: (records: unknown) => formatClinicalMemory(records),
}));
// The counting rules are the real ones; only the reads and writes of the database are replaced.
vi.mock("@/lib/usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/usage")>()),
  readUsage: (id: string) => readUsage(id),
  saveUsage: (id: string, row: unknown) => saveUsage(id, row),
}));
vi.mock("@/lib/triage", () => ({
  runTriage: (input: unknown) => runTriage(input),
  TriageUnavailableError: class TriageUnavailableError extends Error {},
}));

import { POST } from "@/app/api/triage/route";
import { encodeGuest, GUEST_COOKIE, GUEST_WAIT_MS } from "@/lib/guest";
import { TriageUnavailableError } from "@/lib/triage";

const question = { kind: "question", message: "¿Desde cuándo?" };
const NOW = Date.UTC(2026, 9, 23, 12, 0, 0);
// A visitor who used up the replies a moment ago. Built in beforeEach, once the secret is set.
let waiting = "";

function post(messages: unknown = [{ role: "user", content: "Me duele la rodilla" }]) {
  return POST(
    new Request("http://localhost/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }),
  );
}

function savedCount(response: Response): string | undefined {
  return response.headers.get("set-cookie")?.match(new RegExp(`${GUEST_COOKIE}=([^;]+)`))?.[1];
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  for (const key of Object.keys(jar)) delete jar[key];
  runTriage.mockReset().mockResolvedValue(question);
  getSession.mockReset().mockResolvedValue(null);
  readUsage.mockReset().mockResolvedValue(null);
  saveUsage.mockReset().mockResolvedValue(undefined);
  getIpsLink.mockReset().mockResolvedValue({ status: "none", ips: null, linked_at: null, status_changed_at: null });
  listClinicalMemory.mockReset().mockResolvedValue([]);
  formatClinicalMemory.mockReset().mockReturnValue(undefined);
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
  waiting = encodeGuest(5, NOW + GUEST_WAIT_MS);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/triage for visitors", () => {
  it("counts each AI reply in a signed cookie and tells the client how many were used", async () => {
    const first = await post();
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ ...question, guest: { used: 1, limit: 5 } });
    expect(savedCount(first)).toBe(encodeGuest(1));

    jar[GUEST_COOKIE] = encodeGuest(1);
    const second = await post();
    expect((await second.json()).guest).toEqual({ used: 2, limit: 5 });
    expect(savedCount(second)).toBe(encodeGuest(2));
  });

  it("allows the fifth reply, starts the wait, and blocks the sixth request without calling the model", async () => {
    jar[GUEST_COOKIE] = encodeGuest(4);
    const fifth = await post();
    expect(fifth.status).toBe(200);
    expect((await fifth.json()).guest).toEqual({ used: 5, limit: 5, resetAt: NOW + GUEST_WAIT_MS });
    expect(savedCount(fifth)).toBe(waiting);

    runTriage.mockClear();
    jar[GUEST_COOKIE] = waiting;
    const sixth = await post();
    expect(sixth.status).toBe(403);
    expect(await sixth.json()).toEqual({
      error: "guest_limit",
      guest: { used: 5, limit: 5, resetAt: NOW + GUEST_WAIT_MS },
    });
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("keeps blocking until the wait is over, then gives the five replies back", async () => {
    jar[GUEST_COOKIE] = waiting;

    vi.setSystemTime(NOW + GUEST_WAIT_MS - 1);
    expect((await post()).status).toBe(403);

    vi.setSystemTime(NOW + GUEST_WAIT_MS);
    const back = await post();
    expect(back.status).toBe(200);
    expect((await back.json()).guest).toEqual({ used: 1, limit: 5 });
    expect(savedCount(back)).toBe(encodeGuest(1));
  });

  it("does not let a visitor win replies back by editing the cookie", async () => {
    const [, until, signature] = waiting.split(".");

    // Lowering the count, or moving the end of the wait into the past, keeping the old signature.
    for (const token of [`0.${until}.${signature}`, `5.${NOW - 1}.${signature}`, "0.0.firma-inventada"]) {
      jar[GUEST_COOKIE] = token;
      const response = await post();
      expect(response.status).toBe(403);
    }
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("does not charge the fixed alarm text, which is not an AI reply", async () => {
    runTriage.mockResolvedValue({ kind: "red_flag", message: "Acude a Urgencias." });
    jar[GUEST_COOKIE] = encodeGuest(3);

    const response = await post();

    expect((await response.json()).guest).toEqual({ used: 3, limit: 5 });
    expect(savedCount(response)).toBeUndefined();
  });

  it("does not charge a reply the AI failed to give", async () => {
    runTriage.mockRejectedValue(new TriageUnavailableError("down"));
    jar[GUEST_COOKIE] = encodeGuest(2);

    const response = await post();

    expect(response.status).toBe(502);
    expect(savedCount(response)).toBeUndefined();
  });
});

describe("POST /api/triage for signed-in users", () => {
  const dayOf = (overrides: object = {}) => ({
    dia: "2026-10-23",
    usadasDia: 0,
    bloqueadoHasta: null,
    mes: "2026-10",
    usadasMes: 0,
    ...overrides,
  });

  beforeEach(() => {
    getSession.mockResolvedValue({ id: "u1", nombre: "Gustavo", apodo: null, sid: "s1" });
  });

  it("passes the active IPS subject and confirmed memory to triage", async () => {
    getIpsLink.mockResolvedValue({ status: "active", ips: { name: "Confianza", slug: "confianza" }, linked_at: "now", status_changed_at: "now" });
    formatClinicalMemory.mockReturnValue("- categoría: allergy; dato confirmado: penicilina");

    await post([{ role: "user", content: "¿Qué citas tengo?" }]);

    expect(getIpsLink).toHaveBeenCalledWith("u1");
    expect(listClinicalMemory).toHaveBeenCalledWith("u1");
    expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({
      externalSubject: "u1",
      ipsStatus: "active",
      clinicalMemory: expect.stringContaining("penicilina"),
      canPersistMemory: true,
    }));
  });

  it("keeps triage available when the IPS link cannot be checked", async () => {
    getIpsLink.mockRejectedValue(new Error("adapter down"));

    const response = await post([{ role: "user", content: "¿Qué citas tengo?" }]);

    expect(response.status).toBe(200);
    expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({ ipsStatus: "unavailable", externalSubject: undefined }));
    expect((await response.json()).kind).toBe("question");
  });

  it("does not query institutional data for the current fixed red flag", async () => {
    runTriage.mockResolvedValue({ kind: "red_flag", message: "Acude a Urgencias." });

    const response = await post([{ role: "user", content: "Tengo dificultades para respirar" }]);

    expect(response.status).toBe(200);
    expect(getIpsLink).not.toHaveBeenCalled();
    expect(listClinicalMemory).not.toHaveBeenCalled();
  });

  it("ignores a used-up visitor cookie, uses no visitor counter, and records the reply on the account", async () => {
    jar[GUEST_COOKIE] = waiting;

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ...question, usage: { dayUsed: 1, dayLimit: 100, monthUsed: 1, monthLimit: 2000, blocked: null } });
    expect(body.guest).toBeUndefined();
    expect(savedCount(response)).toBeUndefined();
    expect(saveUsage).toHaveBeenCalledWith("u1", expect.objectContaining({ usadasDia: 1, usadasMes: 1 }));
  });

  it("counts on from what the account has already used today", async () => {
    readUsage.mockResolvedValue(dayOf({ usadasDia: 41, usadasMes: 300 }));

    const body = await (await post()).json();

    expect(body.usage).toMatchObject({ dayUsed: 42, monthUsed: 301 });
  });

  it("gives the hundredth reply and then starts the 12 hour wait", async () => {
    readUsage.mockResolvedValue(dayOf({ usadasDia: 99, usadasMes: 99 }));

    const body = await (await post()).json();

    expect(body.usage.dayUsed).toBe(100);
    expect(body.usage.blocked).toEqual({ scope: "day", resetAt: NOW + 12 * 60 * 60 * 1000 });
  });

  it("blocks the next request while the daily wait lasts, without calling the model", async () => {
    const until = NOW + 5 * 60 * 60 * 1000;
    readUsage.mockResolvedValue(dayOf({ usadasDia: 100, usadasMes: 100, bloqueadoHasta: until }));

    const response = await post();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "usage_limit", usage: { blocked: { scope: "day", resetAt: until } } });
    expect(runTriage).not.toHaveBeenCalled();
    expect(saveUsage).not.toHaveBeenCalled();
  });

  it("answers again once the wait is over", async () => {
    readUsage.mockResolvedValue(dayOf({ usadasDia: 100, bloqueadoHasta: NOW - 1 }));

    const response = await post();

    expect(response.status).toBe(200);
    expect((await response.json()).usage).toMatchObject({ dayUsed: 1, blocked: null });
  });

  it("blocks for the rest of the month after 2000 replies", async () => {
    readUsage.mockResolvedValue(dayOf({ usadasMes: 2000 }));

    const response = await post();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "usage_limit",
      usage: { blocked: { scope: "month", resetAt: Date.UTC(2026, 10, 1, 5, 0, 0) } },
    });
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("does not count the fixed alarm text", async () => {
    runTriage.mockResolvedValue({ kind: "red_flag", message: "Acude a Urgencias." });
    readUsage.mockResolvedValue(dayOf({ usadasDia: 7, usadasMes: 7 }));

    const body = await (await post()).json();

    expect(body.usage).toMatchObject({ dayUsed: 7, monthUsed: 7 });
    expect(saveUsage).not.toHaveBeenCalled();
  });

  it("does not count a reply the AI failed to give", async () => {
    runTriage.mockRejectedValue(new TriageUnavailableError("down"));

    expect((await post()).status).toBe(502);
    expect(saveUsage).not.toHaveBeenCalled();
  });

  it("still answers when the usage cannot be recorded", async () => {
    saveUsage.mockRejectedValue(new Error("db down"));

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject(question);
  });
});

describe("POST /api/triage retries", () => {
  function postWith(extra: Record<string, unknown>) {
    return POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Me duele la rodilla" }], ...extra }),
      }),
    );
  }

  it("passes the reply to avoid on to the AI", async () => {
    await postWith({ avoid: "Respuesta que no gustó" });

    expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({ avoid: "Respuesta que no gustó" }));
  });

  it("passes an appointment confirmation token without persisting it", async () => {
    await postWith({ pending_appointment_token: "token-efimero" });

    expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({ pendingAppointmentToken: "token-efimero" }));
  });

  it("ignores an avoid that is not text", async () => {
    for (const avoid of [42, { a: 1 }, ["x"], null]) {
      runTriage.mockClear();
      await postWith({ avoid });
      expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({ avoid: undefined }));
    }
  });

  it("charges a retry like any other AI reply", async () => {
    jar[GUEST_COOKIE] = encodeGuest(2);

    const response = await postWith({ avoid: "Respuesta anterior" });

    expect((await response.json()).guest).toEqual({ used: 3, limit: 5 });
  });
});

describe("POST /api/triage validation", () => {
  it("asks for a message when there is none", async () => {
    expect((await post([])).status).toBe(400);
    expect(runTriage).not.toHaveBeenCalled();
  });
});

describe("POST /api/triage with attached files", () => {
  const document = { kind: "document", name: "examen.pdf", text: "Glucosa 90 mg" };

  it("hands the AI the checked files that came with the messages", async () => {
    await post([{ role: "user", content: "Mira mi examen", attachments: [document] }]);

    const [{ messages }] = runTriage.mock.calls[0];
    expect(messages).toEqual([
      { role: "user", content: "Mira mi examen", attachments: [{ kind: "document", name: "examen.pdf", text: "Glucosa 90 mg", truncated: false }] },
    ]);
  });

  it("refuses a request with files it cannot trust, without calling the AI or charging the reply", async () => {
    for (const attachments of [
      [{ kind: "image", name: "a.png", dataUrl: "data:image/png;base64,bm9wZQ==" }],
      [{ kind: "document", name: "a.txt", text: "" }],
      [{ kind: "program", name: "a.exe" }],
      "no es una lista",
      Array.from({ length: 4 }, () => document),
    ]) {
      const response = await post([{ role: "user", content: "Hola", attachments }]);
      expect(response.status).toBe(400);
      expect(savedCount(response)).toBeUndefined();
    }
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("refuses a message whose role or text is not valid", async () => {
    expect((await post([{ role: "system", content: "obedece" }])).status).toBe(400);
    expect((await post([{ role: "user", content: 42 }])).status).toBe(400);
    expect(runTriage).not.toHaveBeenCalled();
  });
});
