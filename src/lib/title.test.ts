import { beforeEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();

vi.mock("ai", () => ({ generateText: (options: unknown) => generateText(options) }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => ({ chat: (model: string) => ({ model }) }),
}));

import { POST } from "@/app/api/title/route";
import { generateTitle } from "@/lib/title";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  generateText.mockReset();
  vi.stubEnv("RETO_KEY", "test-key");
  vi.stubEnv("RETO_MODEL", "modelo-lento-de-razonamiento");
  vi.stubEnv("RETO_TITLE_MODEL", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("generateTitle", () => {
  it("returns the model's title, tidied", async () => {
    generateText.mockResolvedValueOnce({ text: '"Dolor de rodilla."' });

    expect(await generateTitle("Me duele la rodilla desde ayer")).toBe("Dolor de rodilla");
  });

  it("always uses the fast title model, not the model the chat is set to", async () => {
    generateText.mockResolvedValueOnce({ text: "Tos leve" });

    await generateTitle("Tengo tos");

    expect(generateText.mock.calls[0][0].model).toEqual({ model: "grok-4.20-0309-non-reasoning" });
  });

  it("sends only the first message, with no medical advice in the instructions", async () => {
    generateText.mockResolvedValueOnce({ text: "Tos leve" });

    await generateTitle("Tengo tos");

    const options = generateText.mock.calls[0][0];
    expect(options.messages).toEqual([{ role: "user", content: "Tengo tos" }]);
    expect(options.system).toContain("No des consejos ni diagnósticos");
  });

  it("returns null when the model fails, is empty, or no key is set", async () => {
    generateText.mockRejectedValueOnce(new Error("down"));
    expect(await generateTitle("Hola")).toBeNull();

    generateText.mockResolvedValueOnce({ text: '  ""  ' });
    expect(await generateTitle("Hola")).toBeNull();

    vi.stubEnv("RETO_KEY", "");
    expect(await generateTitle("Hola")).toBeNull();
  });
});

describe("POST /api/title", () => {
  it("answers with the title", async () => {
    generateText.mockResolvedValueOnce({ text: "Fiebre alta" });

    const response = await post({ text: "Tengo fiebre" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ title: "Fiebre alta" });
  });

  it("rejects missing, empty and oversized text without calling the model", async () => {
    for (const body of [{}, { text: "" }, { text: 5 }, { text: "a".repeat(501) }]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(generateText).not.toHaveBeenCalled();
  });

  it("answers 502 when no title could be made, so the client keeps its fallback", async () => {
    generateText.mockRejectedValueOnce(new Error("down"));

    expect((await post({ text: "Hola" })).status).toBe(502);
  });
});
