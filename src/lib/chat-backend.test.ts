import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatBackendError, completeWithWayloBackend } from "@/lib/chat-backend";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("WAYLO_BACKEND_URL", "http://backend.test/");
  vi.stubEnv("WAYLO_BACKEND_KEY", "internal-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("completeWithWayloBackend", () => {
  it("sends the active IPS subject and pending appointment token server-side", async () => {
    fetchMock.mockResolvedValue(Response.json({ text: '{"mensaje":"ok","listo":false}' }));

    const result = await completeWithWayloBackend({
      model: "grok-test",
      temperature: 0.4,
      system: "Eres Waylo.",
      messages: [{ role: "user", content: "Quiero una cita" }],
      externalSubject: "persona-1",
      pendingAppointmentToken: "token-1",
    });

    expect(result.text).toContain("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/internal/chat/completion",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Waylo-Internal-Key": "internal-key" }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      external_subject: "persona-1",
      pending_appointment_token: "token-1",
    });
  });

  it("normalizes backend errors without exposing credentials", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: "UNAUTHORIZED", message: "invalid key" } }, { status: 401 }));

    await expect(completeWithWayloBackend({
      model: "grok-test",
      temperature: 0.4,
      system: "x",
      messages: [{ role: "user", content: "x" }],
    })).rejects.toMatchObject<Partial<ChatBackendError>>({ code: "UNAUTHORIZED", status: 401 });
  });

  it("fails closed when the private integration is not configured", async () => {
    vi.stubEnv("WAYLO_BACKEND_URL", "");

    await expect(completeWithWayloBackend({
      model: "grok-test",
      temperature: 0.4,
      system: "x",
      messages: [{ role: "user", content: "x" }],
    })).rejects.toMatchObject({ code: "integration_unconfigured", status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
