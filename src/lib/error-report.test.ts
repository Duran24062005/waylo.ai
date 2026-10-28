import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

async function load() {
  vi.resetModules();
  return import("@/lib/error-report");
}

beforeEach(() => {
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("DISCORD_ERRORS_WEBHOOK_URL", WEBHOOK);
  vi.stubEnv("NODE_ENV", "production");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const sent = (call = 0) => JSON.parse(String(fetchMock.mock.calls[call][1].body));

describe("sendErrorReport", () => {
  it("sends the place, the error and its stack to the errors channel", async () => {
    const { sendErrorReport } = await load();
    const error = Object.assign(new Error("gateway timed out"), { status: 504, code: "ETIMEDOUT" });
    await sendErrorReport("api/triage", error, { método: "POST" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK);
    const embed = sent().embeds[0];
    expect(embed.title).toContain("api/triage");
    expect(embed.description).toContain("Error: gateway timed out");
    const names = embed.fields.map((field: { name: string }) => field.name);
    expect(names).toEqual(expect.arrayContaining(["Entorno", "Estado", "Código", "método", "Stack"]));
    expect(sent().allowed_mentions).toEqual({ parse: [] });
  });

  it("hides secrets and email addresses", async () => {
    const { sendErrorReport } = await load();
    await sendErrorReport(
      "db",
      new Error(
        "connect failed postgresql://user:hunter2@host/db?sslmode=require Bearer abc.def-123 ana@correo.com " +
          "key sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh https://x.test/cb?code=999999&state=1",
      ),
    );
    const text = JSON.stringify(sent());
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("abc.def-123");
    expect(text).not.toContain("ana@correo.com");
    expect(text).not.toContain("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(text).not.toContain("code=999999");
    expect(text).toContain("host/db");
  });

  it("does nothing when the channel is not configured, is not Discord's, or in development", async () => {
    const { sendErrorReport } = await load();
    vi.stubEnv("DISCORD_ERRORS_WEBHOOK_URL", "");
    await sendErrorReport("a", new Error("x"));
    vi.stubEnv("DISCORD_ERRORS_WEBHOOK_URL", "https://evil.example.com/hook");
    await sendErrorReport("b", new Error("y"));
    vi.stubEnv("DISCORD_ERRORS_WEBHOOK_URL", WEBHOOK);
    vi.stubEnv("NODE_ENV", "development");
    await sendErrorReport("c", new Error("z"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the same error once a minute and reports how many repeats were left out", async () => {
    const { sendErrorReport } = await load();
    for (let i = 0; i < 4; i++) await sendErrorReport("api/triage", new Error("down"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-10-28T12:01:30Z"));
    await sendErrorReport("api/triage", new Error("down"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const repeated = sent(1).embeds[0].fields.find((field: { name: string }) => field.name === "Repetidos omitidos");
    expect(repeated.value).toContain("3");
  });

  it("treats other places or other errors as separate", async () => {
    const { sendErrorReport } = await load();
    await sendErrorReport("api/triage", new Error("down"));
    await sendErrorReport("api/title", new Error("down"));
    await sendErrorReport("api/triage", new Error("different"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("never sends more than 20 messages a minute", async () => {
    const { sendErrorReport } = await load();
    for (let i = 0; i < 30; i++) await sendErrorReport(`route-${i}`, new Error("boom"));
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });

  it("does not throw when Discord is down", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const { sendErrorReport } = await load();
    await expect(sendErrorReport("api/x", new Error("boom"))).resolves.toBeUndefined();
  });
});

describe("reportError", () => {
  it("works outside a request and never throws", async () => {
    const { reportError } = await load();
    expect(() => reportError("api/x", new Error("boom"))).not.toThrow();
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("onRequestError", () => {
  it("reports the path without its query string", async () => {
    vi.resetModules();
    const { onRequestError } = await import("@/instrumentation");
    await onRequestError(
      new Error("render failed"),
      { path: "/chat?code=secret-123&state=abc", method: "GET", headers: {} },
      { routerKind: "App Router", routePath: "/chat", routeType: "render", revalidateReason: undefined },
    );
    const text = JSON.stringify(sent());
    expect(text).toContain("render /chat");
    expect(text).not.toContain("secret-123");
  });
});
