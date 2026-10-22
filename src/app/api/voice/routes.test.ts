import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as speak } from "@/app/api/voice/speak/route";
import { POST as transcribe } from "@/app/api/voice/transcribe/route";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("RETO_KEY", "test-key");
  vi.stubEnv("RETO_BASE_URL", "https://gateway.test/v1/");
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

describe("POST /api/voice/speak", () => {
  it("sends the text to the gateway with the server-side key and streams the audio back", async () => {
    fetchMock.mockResolvedValueOnce(new Response("AUDIO", { status: 200, headers: { "Content-Type": "audio/mpeg" } }));

    const response = await speak(json({ text: "  Hola, ¿cómo te sientes?  " }));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(await response.text()).toBe("AUDIO");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.test/v1/tts");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toEqual({ text: "Hola, ¿cómo te sientes?", voice_id: "ara", language: "es-MX" });
  });

  it("rejects empty, missing and oversized text without calling the gateway", async () => {
    for (const body of [{ text: "" }, { text: "   " }, {}, { text: 42 }, { text: "a".repeat(601) }]) {
      expect((await speak(json(body))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
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
  it("forwards the recording as a file with the language and returns the text", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ text: "  Me duele la rodilla  ", language: "es-mx" }));

    const response = await transcribe(audioRequest(new Blob(["bytes"], { type: "audio/webm" })));

    expect(await response.json()).toEqual({ text: "Me duele la rodilla" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.test/v1/stt");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const sent = init.body as FormData;
    expect((sent.get("file") as File).name).toBe("voz.webm");
    expect(sent.get("language")).toBe("es");
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
    expect(await response.json()).toEqual({ text: "" });
  });

  it("answers 503 when the key is missing", async () => {
    vi.stubEnv("RETO_KEY", "");
    expect((await transcribe(audioRequest(new Blob(["bytes"])))).status).toBe(503);
  });
});
