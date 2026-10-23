import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar[name] ? { value: jar[name] } : undefined) }),
  headers: async () => ({ get: () => null }),
}));

import { POST as speak } from "@/app/api/voice/speak/route";
import { POST as transcribe } from "@/app/api/voice/transcribe/route";

const fetchMock = vi.fn();

beforeEach(() => {
  for (const key of Object.keys(jar)) delete jar[key];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("RETO_KEY", "test-key");
  vi.stubEnv("RETO_BASE_URL", "https://gateway.test/v1/");
  vi.stubEnv("RETO_VOICE", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const json = (body: unknown) =>
  new Request("http://localhost/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

function audioRequest(blob?: Blob) {
  const form = new FormData();
  if (blob) form.append("audio", blob, "voz.webm");
  return new Request("http://localhost/api/voice/transcribe", { method: "POST", body: form });
}

const audio = () => new Response("AUDIO", { status: 200, headers: { "Content-Type": "audio/mpeg" } });
const sentToGateway = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("POST /api/voice/speak", () => {
  it("sends the text to the gateway with the server-side key and streams the audio back", async () => {
    fetchMock.mockResolvedValueOnce(audio());

    const response = await speak(json({ text: "  Hola, ¿cómo te sientes?  " }));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(await response.text()).toBe("AUDIO");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.test/v1/tts");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(sentToGateway()).toEqual({ text: "Hola, ¿cómo te sientes?", voice_id: "ara", language: "es-MX" });
  });

  it("uses the voice chosen in the settings", async () => {
    fetchMock.mockResolvedValue(audio());

    jar.waylo_voice = "masculino";
    await speak(json({ text: "Hola" }));
    expect(sentToGateway().voice_id).toBe("rex");

    fetchMock.mockClear();
    jar.waylo_voice = "femenino";
    await speak(json({ text: "Hola" }));
    expect(sentToGateway().voice_id).toBe("ara");
  });

  it("falls back to the default voice when the cookie is not a voice", async () => {
    fetchMock.mockResolvedValueOnce(audio());
    jar.waylo_voice = "robot";

    await speak(json({ text: "Hola" }));

    expect(sentToGateway().voice_id).toBe("ara");
  });

  it("lets a preview name the voice before it is saved, ignoring one that does not exist", async () => {
    fetchMock.mockResolvedValue(audio());
    jar.waylo_voice = "femenino";

    await speak(json({ text: "Hola", voice: "masculino" }));
    expect(sentToGateway().voice_id).toBe("rex");

    fetchMock.mockClear();
    await speak(json({ text: "Hola", voice: "nope" }));
    expect(sentToGateway().voice_id).toBe("ara");
  });

  it("speaks in the language of the reply: the one asked for, else the app's", async () => {
    fetchMock.mockResolvedValue(audio());

    await speak(json({ text: "Hello", lang: "en" }));
    expect(sentToGateway().language).toBe("en");

    fetchMock.mockClear();
    await speak(json({ text: "Olá", lang: "pt" }));
    expect(sentToGateway().language).toBe("pt-BR");

    fetchMock.mockClear();
    jar.waylo_lang = "en";
    await speak(json({ text: "Hello" }));
    expect(sentToGateway().language).toBe("en");

    fetchMock.mockClear();
    await speak(json({ text: "Hello", lang: "xx" }));
    expect(sentToGateway().language).toBe("en");
  });

  it("rejects empty, missing and oversized text without calling the gateway", async () => {
    for (const body of [{ text: "" }, { text: "   " }, {}, { text: 42 }, { text: "a".repeat(601) }]) {
      expect((await speak(json(body))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("words its errors in the app's language", async () => {
    jar.waylo_lang = "en";
    expect(await (await speak(json({ text: "" }))).json()).toEqual({ error: "Invalid text." });
    jar.waylo_lang = "pt";
    expect(await (await speak(json({ text: "" }))).json()).toEqual({ error: "Texto inválido." });
  });

  it("answers 502 when the gateway fails, so the client can skip the voice", async () => {
    fetchMock.mockResolvedValueOnce(new Response("busy", { status: 503 }));
    expect((await speak(json({ text: "Hola" }))).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect((await speak(json({ text: "Hola" }))).status).toBe(502);
  });

  it("answers 503 when the key is missing", async () => {
    vi.stubEnv("RETO_KEY", "");
    expect((await speak(json({ text: "Hola" }))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/voice/transcribe", () => {
  const sentForm = () => fetchMock.mock.calls[0][1].body as FormData;

  it("forwards the recording as a file and returns the text, working out the language itself by default", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ text: "  Me duele la rodilla  ", language: "es-mx" }));

    const response = await transcribe(audioRequest(new Blob(["bytes"], { type: "audio/webm" })));

    expect(await response.json()).toEqual({ text: "Me duele la rodilla", language: "es" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.test/v1/stt");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect((sentForm().get("file") as File).name).toBe("voz.webm");
    expect(sentForm().has("language")).toBe(false);
  });

  it("reports the language it heard, so the answer comes back in it", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ text: "I have a headache", language: "en" }));
    expect((await (await transcribe(audioRequest(new Blob(["b"])))).json()).language).toBe("en");

    fetchMock.mockResolvedValueOnce(Response.json({ text: "Estou com dor", language: "pt-br" }));
    expect((await (await transcribe(audioRequest(new Blob(["b"])))).json()).language).toBe("pt");
  });

  it("reports no language when it heard one the app does not speak", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ text: "Bonjour", language: "fr" }));
    expect((await (await transcribe(audioRequest(new Blob(["b"])))).json()).language).toBeNull();
  });

  it("sends the language chosen in the settings and answers with it", async () => {
    jar.waylo_lang = "en";
    fetchMock.mockResolvedValueOnce(Response.json({ text: "Hello", language: "es" }));

    const body = await (await transcribe(audioRequest(new Blob(["b"])))).json();

    expect(sentForm().get("language")).toBe("en");
    expect(body.language).toBe("en");
  });

  it("treats a language cookie that is not valid as automatic", async () => {
    jar.waylo_lang = "xx";
    fetchMock.mockResolvedValueOnce(Response.json({ text: "Hola", language: "es" }));

    await transcribe(audioRequest(new Blob(["b"])));

    expect(sentForm().has("language")).toBe(false);
  });

  it("rejects a request with no audio, an empty one or one that is too large", async () => {
    expect((await transcribe(audioRequest())).status).toBe(400);
    expect((await transcribe(audioRequest(new Blob([])))).status).toBe(400);
    expect((await transcribe(audioRequest(new Blob([new Uint8Array(8 * 1024 * 1024 + 1)])))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the gateway fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    expect((await transcribe(audioRequest(new Blob(["bytes"])))).status).toBe(502);
  });

  it("returns an empty text when the gateway understood nothing", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}));
    const response = await transcribe(audioRequest(new Blob(["bytes"])));
    expect(await response.json()).toEqual({ text: "", language: null });
  });

  it("answers 503 when the key is missing", async () => {
    vi.stubEnv("RETO_KEY", "");
    expect((await transcribe(audioRequest(new Blob(["bytes"])))).status).toBe(503);
  });
});
