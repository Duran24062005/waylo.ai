import { beforeEach, describe, expect, it, vi } from "vitest";

const jar: Record<string, string> = {};
const runTriage = vi.fn();
const getSession = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }),
}));
vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/triage", () => ({
  runTriage: (input: unknown) => runTriage(input),
  TriageUnavailableError: class TriageUnavailableError extends Error {},
}));

import { POST } from "@/app/api/triage/route";
import { encodeGuestCount, GUEST_COOKIE } from "@/lib/guest";
import { TriageUnavailableError } from "@/lib/triage";

const question = { kind: "question", message: "¿Desde cuándo?" };

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
  for (const key of Object.keys(jar)) delete jar[key];
  runTriage.mockReset().mockResolvedValue(question);
  getSession.mockReset().mockResolvedValue(null);
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
});

describe("POST /api/triage for visitors", () => {
  it("counts each AI reply in a signed cookie and tells the client how many were used", async () => {
    const first = await post();
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ ...question, guest: { used: 1, limit: 5 } });
    expect(savedCount(first)).toBe(encodeGuestCount(1));

    jar[GUEST_COOKIE] = encodeGuestCount(1);
    const second = await post();
    expect((await second.json()).guest).toEqual({ used: 2, limit: 5 });
    expect(savedCount(second)).toBe(encodeGuestCount(2));
  });

  it("allows the fifth reply and blocks the sixth request without calling the model", async () => {
    jar[GUEST_COOKIE] = encodeGuestCount(4);
    const fifth = await post();
    expect(fifth.status).toBe(200);
    expect((await fifth.json()).guest).toEqual({ used: 5, limit: 5 });

    runTriage.mockClear();
    jar[GUEST_COOKIE] = encodeGuestCount(5);
    const sixth = await post();
    expect(sixth.status).toBe(403);
    expect(await sixth.json()).toEqual({ error: "guest_limit", guest: { used: 5, limit: 5 } });
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("does not let a visitor win replies back by editing the cookie", async () => {
    jar[GUEST_COOKIE] = `0.${encodeGuestCount(5).split(".")[1]}`;

    const response = await post();

    expect(response.status).toBe(403);
    expect(runTriage).not.toHaveBeenCalled();
  });

  it("does not charge the fixed alarm text, which is not an AI reply", async () => {
    runTriage.mockResolvedValue({ kind: "red_flag", message: "Acude a Urgencias." });
    jar[GUEST_COOKIE] = encodeGuestCount(3);

    const response = await post();

    expect((await response.json()).guest).toEqual({ used: 3, limit: 5 });
    expect(savedCount(response)).toBeUndefined();
  });

  it("does not charge a reply the AI failed to give", async () => {
    runTriage.mockRejectedValue(new TriageUnavailableError("down"));
    jar[GUEST_COOKIE] = encodeGuestCount(2);

    const response = await post();

    expect(response.status).toBe(502);
    expect(savedCount(response)).toBeUndefined();
  });
});

describe("POST /api/triage for signed-in users", () => {
  it("has no limit, even with a used-up visitor cookie, and adds no counter", async () => {
    getSession.mockResolvedValue({ id: "u1", nombre: "Gustavo" });
    jar[GUEST_COOKIE] = encodeGuestCount(5);

    const response = await post();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(question);
    expect(savedCount(response)).toBeUndefined();
    expect(runTriage).toHaveBeenCalledTimes(1);
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

  it("ignores an avoid that is not text", async () => {
    for (const avoid of [42, { a: 1 }, ["x"], null]) {
      runTriage.mockClear();
      await postWith({ avoid });
      expect(runTriage).toHaveBeenCalledWith(expect.objectContaining({ avoid: undefined }));
    }
  });

  it("charges a retry like any other AI reply", async () => {
    jar[GUEST_COOKIE] = encodeGuestCount(2);

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
