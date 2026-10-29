import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const listClinicalMemory = vi.fn();
const createClinicalMemory = vi.fn();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/clinical-memory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/clinical-memory")>()),
  listClinicalMemory: (id: string) => listClinicalMemory(id),
  createClinicalMemory: (id: string, input: unknown) => createClinicalMemory(id, input),
}));

import { GET, POST } from "@/app/api/memoria-clinica/route";

function request(method: string, body?: unknown) {
  return new Request("http://localhost/api/memoria-clinica", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ id: "persona-1" });
  listClinicalMemory.mockReset().mockResolvedValue([]);
  createClinicalMemory.mockReset().mockResolvedValue({ id: "memory-1" });
});

describe("/api/memoria-clinica", () => {
  it("requires an authenticated session", async () => {
    getSession.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect((await POST(request("POST", { category: "allergy", value: "penicilina" }))).status).toBe(401);
  });

  it("lists and creates memory only for the current persona", async () => {
    const memories = [{ id: "memory-1", category: "allergy", value: "penicilina" }];
    listClinicalMemory.mockResolvedValue(memories);
    createClinicalMemory.mockResolvedValue(memories[0]);

    expect(await (await GET()).json()).toEqual({ memories });
    const response = await POST(request("POST", { category: "allergy", value: " penicilina " }));

    expect(response.status).toBe(201);
    expect(createClinicalMemory).toHaveBeenCalledWith("persona-1", {
      category: "allergy",
      value: "penicilina",
      details: {},
    });
  });

  it("rejects an invalid proposal before persistence", async () => {
    const response = await POST(request("POST", { category: "diagnosis", value: "inventado" }));

    expect(response.status).toBe(400);
    expect(createClinicalMemory).not.toHaveBeenCalled();
  });
});
