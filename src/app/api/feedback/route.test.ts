import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/i18n/server", () => ({ getMessages: async () => ({ locale: "es" }) }));

import { POST } from "@/app/api/feedback/route";

const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

function post(body: unknown, ip = "1.1.1.1") {
  return POST(
    new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  getSession.mockResolvedValue(null);
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("DISCORD_FEEDBACK_WEBHOOK_URL", WEBHOOK);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/feedback", () => {
  it("sends the vote to Discord without any conversation text", async () => {
    const response = await post({ vote: "dislike", messageId: "msg-1", content: "me duele el pecho" }, "2.2.2.2");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, delivered: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(WEBHOOK);
    const sent = String(init.body);
    expect(sent).toContain("👎");
    expect(sent).toContain("msg-1");
    expect(sent).not.toContain("pecho");
  });

  it("marks signed-in accounts and likes", async () => {
    getSession.mockResolvedValue({ id: "u1" });
    await post({ vote: "like", messageId: "msg-2" }, "3.3.3.3");
    const sent = String(fetchMock.mock.calls[0][1].body);
    expect(sent).toContain("👍");
    expect(sent).toContain("Cuenta registrada");
  });

  it("rejects an unknown vote or a missing id", async () => {
    expect((await post({ vote: "meh", messageId: "x" }, "4.4.4.4")).status).toBe(400);
    expect((await post({ vote: "like" }, "4.4.4.4")).status).toBe(400);
    expect((await post({ vote: "like", messageId: "x".repeat(200) }, "4.4.4.4")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still answers ok when Discord is not configured", async () => {
    vi.stubEnv("DISCORD_FEEDBACK_WEBHOOK_URL", "");
    const response = await post({ vote: "like", messageId: "msg-3" }, "5.5.5.5");
    expect(await response.json()).toEqual({ ok: true, delivered: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call a webhook that is not Discord's", async () => {
    vi.stubEnv("DISCORD_FEEDBACK_WEBHOOK_URL", "https://evil.example.com/hook");
    await post({ vote: "like", messageId: "msg-4" }, "6.6.6.6");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fail the vote when Discord is down", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const response = await post({ vote: "like", messageId: "msg-5" }, "7.7.7.7");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, delivered: false });
  });

  it("limits how many votes one address can send in a minute", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 22; i++) statuses.push((await post({ vote: "like", messageId: `m${i}` }, "8.8.8.8")).status);
    expect(statuses.slice(0, 20).every((status) => status === 200)).toBe(true);
    expect(statuses.slice(20)).toEqual([429, 429]);
  });
});
