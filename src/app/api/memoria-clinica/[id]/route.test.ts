import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const updateClinicalMemory = vi.fn();
const deleteClinicalMemory = vi.fn();

vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/clinical-memory", () => ({
  CLINICAL_MEMORY_CATEGORIES: ["condition", "allergy", "medication", "surgery", "pregnancy", "other"],
  updateClinicalMemory: (personaId: string, id: string, patch: unknown) => updateClinicalMemory(personaId, id, patch),
  deleteClinicalMemory: (personaId: string, id: string) => deleteClinicalMemory(personaId, id),
}));

import { DELETE, PATCH } from "@/app/api/memoria-clinica/[id]/route";

function request(method: string, body?: unknown) {
  return new Request("http://localhost/api/memoria-clinica/memory-1", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ id: "persona-1" });
  updateClinicalMemory.mockReset().mockResolvedValue({ id: "memory-1", value: "asma" });
  deleteClinicalMemory.mockReset().mockResolvedValue(true);
});

describe("/api/memoria-clinica/:id", () => {
  it("updates only the authenticated persona's memory", async () => {
    const response = await PATCH(request("PATCH", { category: "condition", value: " asma " }), {
      params: Promise.resolve({ id: "memory-1" }),
    });

    expect(response.status).toBe(200);
    expect(updateClinicalMemory).toHaveBeenCalledWith("persona-1", "memory-1", {
      category: "condition",
      value: "asma",
    });
  });

  it("returns not found when deletion does not belong to the persona", async () => {
    deleteClinicalMemory.mockResolvedValue(false);

    const response = await DELETE(request("DELETE"), { params: Promise.resolve({ id: "memory-1" }) });

    expect(response.status).toBe(404);
    expect(deleteClinicalMemory).toHaveBeenCalledWith("persona-1", "memory-1");
  });
});
