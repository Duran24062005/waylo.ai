import { afterEach, describe, expect, it, vi } from "vitest";
import { getIpsAppointments, IpsBackendError, linkIps } from "@/lib/ips-backend";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("server-side IPS backend client", () => {
  it("sends the Waylo subject and internal credential without exposing either to browser code", async () => {
    vi.stubEnv("WAYLO_BACKEND_URL", "https://waylo-backend.example.test/");
    vi.stubEnv("WAYLO_BACKEND_KEY", "a-secret-key-with-at-least-32-characters");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "active", ips: null, linked_at: null, status_changed_at: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await linkIps("waylo-session-1", {
      document_type: "CC",
      document_number: "123456789",
      eps: "Confianza",
      activation_code: "123456",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://waylo-backend.example.test/internal/ips/link",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Waylo-Internal-Key": "a-secret-key-with-at-least-32-characters" }),
        body: JSON.stringify({
          document_type: "CC",
          document_number: "123456789",
          eps: "Confianza",
          activation_code: "123456",
          external_subject: "waylo-session-1",
          ips_id: "confianza",
        }),
      }),
    );
  });

  it("turns a backend response error into a typed integration error", async () => {
    vi.stubEnv("WAYLO_BACKEND_URL", "https://waylo-backend.example.test");
    vi.stubEnv("WAYLO_BACKEND_KEY", "a-secret-key-with-at-least-32-characters");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "NO_ACTIVE_LINK", message: "Sin vínculo" } }), { status: 409 }),
      ),
    );

    await expect(getIpsAppointments("waylo-session-1")).rejects.toMatchObject(
      new IpsBackendError("NO_ACTIVE_LINK", 409, "Sin vínculo"),
    );
  });
});
