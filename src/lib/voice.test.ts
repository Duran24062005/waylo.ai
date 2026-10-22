import { describe, expect, it } from "vitest";
import { createVad, splitForSpeech, type VadEvent } from "@/lib/voice";

/** Feeds the same level every 50 ms for `ms` and returns every event that fired, with its time. */
function run(vad: ReturnType<typeof createVad>, level: number, from: number, ms: number) {
  const events: { at: number; event: VadEvent }[] = [];
  for (let t = from; t < from + ms; t += 50) {
    const event = vad.push(level, t);
    if (event) events.push({ at: t, event });
  }
  return { events, end: from + ms };
}

describe("createVad", () => {
  it("stays quiet in a silent room", () => {
    const vad = createVad();
    expect(run(vad, 0.01, 0, 5000).events).toEqual([]);
  });

  it("detects the start of speech only after it lasts a moment", () => {
    const vad = createVad();
    const { events } = run(vad, 0.3, 0, 1000);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("start");
    expect(events[0].at).toBeGreaterThanOrEqual(140);
  });

  it("ignores a click shorter than the start delay", () => {
    const vad = createVad();
    const burst = run(vad, 0.5, 0, 100);
    const quiet = run(vad, 0.01, burst.end, 3000);

    expect([...burst.events, ...quiet.events]).toEqual([]);
  });

  it("ends the utterance after the pause, not before", () => {
    const vad = createVad();
    const talk = run(vad, 0.3, 0, 1500);
    const shortPause = run(vad, 0.01, talk.end, 500);
    const resume = run(vad, 0.3, shortPause.end, 500);
    const finalPause = run(vad, 0.01, resume.end, 1500);

    expect(talk.events.map((e) => e.event)).toEqual(["start"]);
    expect(shortPause.events).toEqual([]);
    expect(resume.events).toEqual([]);
    expect(finalPause.events.map((e) => e.event)).toEqual(["end"]);
  });

  it("cancels a cough that was long enough to start but too short to be speech", () => {
    const vad = createVad({ minSpeechMs: 600 });
    const cough = run(vad, 0.4, 0, 300);
    const quiet = run(vad, 0.01, cough.end, 2000);

    expect(cough.events.map((e) => e.event)).toEqual(["start"]);
    expect(quiet.events.map((e) => e.event)).toEqual(["cancel"]);
  });

  it("adapts to a noisy room, so steady noise never counts as speech", () => {
    const vad = createVad();
    // A fan at 0.06 is above the minimum threshold, so at first it does trigger...
    const firstSeconds = run(vad, 0.06, 0, 400);
    expect(firstSeconds.events.some((e) => e.event === "start")).toBe(true);

    // ...but a room that is always at that level teaches the floor before anyone speaks.
    const noisy = createVad();
    let t = 0;
    for (let i = 0; i < 200; i += 1, t += 50) noisy.push(0.03, t);
    expect(run(noisy, 0.03, t, 3000).events).toEqual([]);
    expect(run(noisy, 0.35, t + 3000, 600).events.map((e) => e.event)).toEqual(["start"]);
  });

  it("can be reset and detect the next utterance", () => {
    const vad = createVad();
    run(vad, 0.3, 0, 800);
    vad.reset();

    expect(run(vad, 0.3, 5000, 800).events.map((e) => e.event)).toEqual(["start"]);
  });
});

describe("splitForSpeech", () => {
  it("returns nothing for empty text", () => {
    expect(splitForSpeech("   ")).toEqual([]);
  });

  it("keeps a short reply as one piece", () => {
    expect(splitForSpeech("Hola. ¿Cómo te sientes hoy?")).toEqual(["Hola. ¿Cómo te sientes hoy?"]);
  });

  it("splits a long reply by sentence so the first one can start early", () => {
    const text =
      "Entiendo que llevas dos días con la tos y que ya va mejorando poco a poco. Por lo que me cuentas, este caso se beneficia de una atención en Medicina General. Si aparece fiebre alta o te falta el aire, acude a Urgencias de inmediato.";
    const pieces = splitForSpeech(text);

    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((piece) => piece.length <= 220)).toBe(true);
    expect(pieces.join(" ")).toBe(text);
  });

  it("never returns a piece longer than the limit, even for one endless sentence", () => {
    const text = Array.from({ length: 80 }, (_, i) => `palabra${i}`).join(" ");
    const pieces = splitForSpeech(text, 100);

    expect(pieces.every((piece) => piece.length <= 100)).toBe(true);
    expect(pieces.join(" ")).toBe(text);
  });

  it("removes markdown marks that would be read aloud", () => {
    expect(splitForSpeech("**Importante:** acude hoy.")).toEqual(["Importante: acude hoy."]);
  });

  it("joins tiny pieces to the previous one so the voice does not sound choppy", () => {
    expect(splitForSpeech("Sí. Claro. Puedes ir mañana sin problema alguno.")).toHaveLength(1);
  });
});
