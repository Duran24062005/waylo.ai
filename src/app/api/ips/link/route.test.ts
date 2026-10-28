import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const getIpsLink = vi.fn();
const linkIps = vi.fn();
const unlinkIps = vi.fn();
const readSavedCedula = vi.fn();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/eps-db", () => ({ readSavedCedula: (...args: unknown[]) => readSavedCedula(...args) }));
vi.mock("@/lib/ips-backend", () => ({
  getIpsLink: (...args: unknown[]) => getIpsLink(...args),
  linkIps: (...args: unknown[]) => linkIps(...args),
  unlinkIps: (...args: unknown[]) => unlinkIps(...args),
  IpsBackendError: class IpsBackendError extends Error {
    constructor(readonly code: string, readonly status: number, message: string) {
      super(message);
    }
  },
}));

import { DELETE, GET, POST } from "@/app/api/ips/link/route";

const ACTIVE = { status: "active", ips: { name: "Confianza IPS", slug: "confianza" }, linked_at: null, status_changed_at: null } as const;

function request(body: unknown) {
  return new Request("http://localhost/api/ips/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ id: "waylo-session-1" });
  getIpsLink.mockReset().mockResolvedValue(ACTIVE);
  linkIps.mockReset().mockResolvedValue(ACTIVE);
  readSavedCedula.mockReset().mockResolvedValue("1098765432");
  unlinkIps.mockReset().mockResolvedValue({ status: "unlinked", ips: null, linked_at: null, status_changed_at: null });
});

describe("/api/ips/link", () => {
  it("requires the Waylo session for every operation", async () => {
    getSession.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect((await POST(request({}))).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
    expect(getIpsLink).not.toHaveBeenCalled();
    expect(linkIps).not.toHaveBeenCalled();
    expect(unlinkIps).not.toHaveBeenCalled();
  });

  it("validates the activation payload before calling the backend adapter", async () => {
    const response = await POST(request({ document_type: "CC", document_number: "12", eps: "sanitas", activation_code: "12345" }));

    expect(response.status).toBe(400);
    expect(linkIps).not.toHaveBeenCalled();
  });

  it("maps the citizen payload to the Confianza adapter contract", async () => {
    const response = await POST(
      request({ document_type: "CC", document_number: " 1032456789 ", eps: "confianza", activation_code: "123456" }),
    );

    expect(response.status).toBe(200);
    expect(linkIps).toHaveBeenCalledWith("waylo-session-1", {
      document_type: "CC",
      document_number: "1032456789",
      eps: "Confianza",
      activation_code: "123456",
    });
    expect(await response.json()).toEqual(ACTIVE);
  });

  it("links with the ID number saved on the server when the page does not send one", async () => {
    const response = await POST(request({ document_type: "CC", eps: "confianza", activation_code: "123456" }));

    expect(response.status).toBe(200);
    expect(readSavedCedula).toHaveBeenCalledWith("waylo-session-1");
    expect(linkIps).toHaveBeenCalledWith("waylo-session-1", {
      document_type: "CC",
      document_number: "1098765432",
      eps: "Confianza",
      activation_code: "123456",
    });
  });

  it("does not read the saved number when the page sends one", async () => {
    await POST(request({ document_type: "CC", document_number: "1032456789", eps: "confianza", activation_code: "123456" }));

    expect(readSavedCedula).not.toHaveBeenCalled();
    expect(linkIps.mock.calls[0][1].document_number).toBe("1032456789");
  });

  it("asks for the ID number when none was sent and none is saved", async () => {
    readSavedCedula.mockResolvedValue(null);
    const response = await POST(request({ document_type: "CC", eps: "confianza", activation_code: "123456" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "CEDULA_REQUIRED" });
    expect(linkIps).not.toHaveBeenCalled();
  });

  it("treats a failure reading the saved number as a missing one", async () => {
    readSavedCedula.mockRejectedValue(new Error("db down"));
    const response = await POST(request({ document_type: "CC", eps: "confianza", activation_code: "123456" }));

    expect(response.status).toBe(400);
    expect(linkIps).not.toHaveBeenCalled();
  });

  it("reads and revokes only the session-owned link", async () => {
    await GET();
    await DELETE();

    expect(getIpsLink).toHaveBeenCalledWith("waylo-session-1");
    expect(unlinkIps).toHaveBeenCalledWith("waylo-session-1");
  });
});
