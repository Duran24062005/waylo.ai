import { beforeEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();

vi.mock("ai", () => ({ generateText: (options: unknown) => generateText(options) }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => ({ chat: (model: string) => ({ model }) }),
}));

import { ORIENTATION_MARK, orientationNote } from "@/lib/orientation-note";
import { RED_FLAG_MESSAGE } from "@/lib/red-flags";
import { asModelTurn, runTriage, TriageUnavailableError } from "@/lib/triage";

function reply(payload: unknown) {
  generateText.mockResolvedValueOnce({ text: typeof payload === "string" ? payload : JSON.stringify(payload) });
}

const user = (content: string) => ({ role: "user" as const, content });
const bot = (content: string) => ({ role: "assistant" as const, content });

beforeEach(() => {
  generateText.mockReset();
  vi.stubEnv("RETO_KEY", "test-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("runTriage", () => {
  it("answers a vital alarm with the fixed text and never calls the model", async () => {
    const result = await runTriage({ messages: [user("Tengo dificultades para respirar")] });

    expect(result).toEqual({ kind: "red_flag", message: RED_FLAG_MESSAGE });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("uses the model's own message for a normal turn", async () => {
    reply({ mensaje: "Siento que te duela. ¿Desde cuándo lo tienes?", listo: false });

    const result = await runTriage({ messages: [user("Me duele la cabeza")] });

    expect(result).toEqual({ kind: "question", message: "Siento que te duela. ¿Desde cuándo lo tienes?" });
  });

  it("sends the conversation with real roles, not as flattened text", async () => {
    reply({ mensaje: "Claro.", listo: false });

    await runTriage({ messages: [user("Hola"), bot("¿Qué sientes?"), user("Dolor de rodilla")] });

    const options = generateText.mock.calls[0][0];
    // Its own earlier turn comes back in the JSON format it must keep producing.
    expect(options.messages).toEqual([
      user("Hola"),
      bot(JSON.stringify({ mensaje: "¿Qué sientes?", listo: false })),
      user("Dolor de rodilla"),
    ]);
    expect(options.prompt).toBeUndefined();
  });

  it("returns the model's message together with the card when it can orient", async () => {
    reply({
      mensaje: "Por lo que me cuentas, una cita de medicina general puede ayudarte.",
      listo: true,
      nivel: "general",
      justificacion: "Molestia leve y estable.",
      queLlevar: ["Documento de identidad"],
    });

    const result = await runTriage({ messages: [user("Tos leve desde ayer")], eps: "Sanitas" });

    expect(result.kind).toBe("orientation");
    expect(result.message).toBe("Por lo que me cuentas, una cita de medicina general puede ayudarte.");
    expect(result.card?.nivel).toBe("general");
    expect(result.card?.nivelLabel).toBe("Medicina General");
    expect(result.card?.queLlevar).toEqual(["Documento de identidad"]);
    expect(result.card?.sedes.length).toBeGreaterThan(0);
  });

  it("keeps a plain-text reply as the model's message", async () => {
    reply("Entiendo, cuéntame un poco más sobre cómo empezó.");

    const result = await runTriage({ messages: [user("no se")] });

    expect(result).toEqual({ kind: "question", message: "Entiendo, cuéntame un poco más sobre cómo empezó." });
  });

  it("offers no suggested replies, even if the model sends some", async () => {
    reply({ mensaje: "¿Cómo es el dolor?", listo: false, opciones: ["a", "b"] });

    const result = await runTriage({ messages: [user("Me duele el estómago")] });

    expect(result).toEqual({ kind: "question", message: "¿Cómo es el dolor?" });
    expect(result).not.toHaveProperty("quickReplies");
  });

  it("fails instead of inventing a scripted answer when the model errors", async () => {
    generateText.mockRejectedValueOnce(Object.assign(new Error("Bad Request"), { statusCode: 400 }));

    await expect(runTriage({ messages: [user("Me duele la rodilla")] })).rejects.toBeInstanceOf(TriageUnavailableError);
  });

  it("fails when the key is missing", async () => {
    vi.stubEnv("RETO_KEY", "");

    await expect(runTriage({ messages: [user("Me duele la rodilla")] })).rejects.toBeInstanceOf(TriageUnavailableError);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("fails on broken JSON and on a question without a message", async () => {
    reply('{"mensaje": "incompleto", "listo": ');
    await expect(runTriage({ messages: [user("Hola")] })).rejects.toBeInstanceOf(TriageUnavailableError);

    reply({ listo: false });
    await expect(runTriage({ messages: [user("Hola")] })).rejects.toBeInstanceOf(TriageUnavailableError);
  });

  it("tells the model about an earlier alarm when the patient keeps writing", async () => {
    reply({ mensaje: "Estoy contigo. Acude ya a Urgencias.", listo: true, nivel: "urgencias" });

    const result = await runTriage({
      messages: [user("Tengo dificultades para respirar"), bot(RED_FLAG_MESSAGE), user("no puedo")],
    });

    expect(generateText.mock.calls[0][0].system).toContain("alarma vital");
    expect(result.kind).toBe("orientation");
    expect(result.card?.nivel).toBe("urgencias");
  });

  it("does not force a second card after the alarm was already answered with one", async () => {
    const card = (await runTriage_cardFixture()).card!;
    reply({ mensaje: "Por favor, ve ya a Urgencias.", listo: false });

    await runTriage({
      messages: [
        user("Tengo dificultades para respirar"),
        { ...bot("Ve a Urgencias."), content: `Ve a Urgencias.\n${orientationNote(card)}` },
        user("?"),
      ],
    });

    const system = generateText.mock.calls[1][0].system;
    expect(system).toContain("sin repetir la tarjeta");
    expect(system).toContain("insiste con calidez");
    expect(system).not.toContain("Responde con listo:true");
  });

  it("tells the model it already oriented, so it converses instead of repeating the card", async () => {
    const card = (await runTriage_cardFixture()).card!;
    reply({ mensaje: "Te lo digo porque tus síntomas son leves y van mejorando.", listo: false });

    const result = await runTriage({
      messages: [
        user("Tos leve"),
        { ...bot("Te recomiendo medicina general."), content: `Te recomiendo medicina general.\n${orientationNote(card)}` },
        user("¿Por qué?"),
      ],
    });

    expect(generateText.mock.calls[1][0].system).toContain("Ya entregaste una orientación");
    expect(result).toEqual({ kind: "question", message: "Te lo digo porque tus síntomas son leves y van mejorando." });
  });

  it("forces an orientation after five patient replies without one", async () => {
    reply({ mensaje: "Con lo que me cuentas, esto es lo que te recomiendo.", listo: true, nivel: "prioritaria" });

    await runTriage({
      messages: [user("1"), bot("a"), user("2"), bot("b"), user("3"), bot("c"), user("4"), bot("d"), user("5")],
    });

    expect(generateText.mock.calls[0][0].system).toContain("Ya preguntaste suficiente");
  });
});

describe("retrying a reply", () => {
  const messages = [user("Me duele la rodilla")];

  it("tells the model which answer the patient did not like and asks for a different one", async () => {
    reply({ mensaje: "Cuéntame, ¿el dolor aparece al caminar?", listo: false });

    await runTriage({ messages, avoid: "¿Desde cuándo te duele la rodilla?" });

    const { system } = generateText.mock.calls[0][0];
    expect(system).toContain("pidió otra respuesta");
    expect(system).toContain("¿Desde cuándo te duele la rodilla?");
    expect(system).toContain("de otra manera");
    expect(system).toContain("no cambies el nivel de atención");
  });

  it("lets the model vary more on a retry than on a first answer", async () => {
    reply({ mensaje: "a", listo: false });
    reply({ mensaje: "b", listo: false });

    await runTriage({ messages });
    await runTriage({ messages, avoid: "respuesta anterior" });

    expect(generateText.mock.calls[0][0].temperature).toBe(0.4);
    expect(generateText.mock.calls[1][0].temperature).toBe(0.9);
  });

  it("adds nothing when there is no reply to avoid, or it is blank", async () => {
    reply({ mensaje: "a", listo: false });
    reply({ mensaje: "b", listo: false });

    await runTriage({ messages });
    await runTriage({ messages, avoid: "   " });

    for (const call of generateText.mock.calls) {
      expect(call[0].system).not.toContain("pidió otra respuesta");
      expect(call[0].temperature).toBe(0.4);
    }
  });

  it("keeps only the start of a very long reply, so the prompt stays small", async () => {
    reply({ mensaje: "a", listo: false });

    await runTriage({ messages, avoid: "x".repeat(5000) });

    const { system } = generateText.mock.calls[0][0] as { system: string };
    expect(system).toContain("x".repeat(800));
    expect(system).not.toContain("x".repeat(801));
  });

  it("still sends the same patient message, so the question being answered does not change", async () => {
    reply({ mensaje: "a", listo: false });

    await runTriage({ messages, avoid: "respuesta anterior" });

    expect(generateText.mock.calls[0][0].messages).toEqual([user("Me duele la rodilla")]);
  });
});

describe("asModelTurn", () => {
  it("leaves patient messages alone", () => {
    expect(asModelTurn(user("Hola"))).toEqual(user("Hola"));
  });

  it("wraps a normal assistant turn as a conversational JSON", () => {
    expect(JSON.parse(asModelTurn(bot("¿Desde cuándo?")).content)).toEqual({ mensaje: "¿Desde cuándo?", listo: false });
  });

  it("turns the orientation note into a field, so the model does not copy the bracket text", () => {
    const content = `Te recomiendo medicina general.\n${ORIENTATION_MARK}: Medicina General. Molestia leve.]`;

    expect(JSON.parse(asModelTurn(bot(content)).content)).toEqual({
      mensaje: "Te recomiendo medicina general.",
      listo: true,
      orientacion_entregada: "Medicina General. Molestia leve.",
    });
  });
});

describe("orientationNote", () => {
  it("carries the mark, the level and the reason", async () => {
    const { card } = await runTriage_cardFixture();
    const note = orientationNote(card!);

    expect(note.startsWith(ORIENTATION_MARK)).toBe(true);
    expect(note).toContain("Medicina General");
    expect(note).toContain("Molestia leve.");
  });
});

async function runTriage_cardFixture() {
  generateText.mockResolvedValueOnce({
    text: JSON.stringify({ mensaje: "ok", listo: true, nivel: "general", justificacion: "Molestia leve." }),
  });
  return runTriage({ messages: [user("Tos leve")] });
}
