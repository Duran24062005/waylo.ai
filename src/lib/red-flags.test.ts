import { describe, expect, it } from "vitest";
import { detectRedFlag, RED_FLAG_MESSAGE } from "@/lib/red-flags";

const URGENT_CASES = [
  "Me duele mucho el pecho desde hace 20 minutos",
  "Siento opresión en el pecho y miedo",
  "Tengo dolor en el brazo izquierdo que sube al hombro",
  "No puedo respirar, me ahogo",
  "Me falta el aire y apenas puedo hablar",
  "Se me cayó la cara y no puedo mover el lado izquierdo",
  "Tengo parálisis de un lado del cuerpo",
  "No puedo hablar, se me traban las palabras",
  "Hay un sangrado incontrolable en la herida",
  "Estoy desangrándome, no para de sangrar",
  "Mi papá perdió el conocimiento y no responde",
  "Se desmayó y está inconsciente",
  "Quiero matarme, no quiero seguir viviendo",
  "Tengo pensamientos de autolesión",
  "Dolor torácico fuerte al caminar",
  "Sensación de ahogo de golpe",
  "Convulsionó y no despierta",
  "Hemorragia que no para después del golpe",
  "Boca torcida y debilidad repentina",
  "Me aprieta el pecho y sudo frío",
  "No me entra el aire desde hace unos minutos",
  "Voy a suicidarme esta noche",
];

const NON_URGENT_CASES = [
  "Me duele la cabeza desde ayer",
  "Tengo fiebre baja y mocos",
  "Dolor abdominal leve después de comer",
  "Me golpeé la rodilla, puedo caminar",
  "Quiero una cita de medicina general",
  "Tengo tos hace una semana, sin falta de aire",
];

describe("detectRedFlag", () => {
  it.each(URGENT_CASES)("marca urgencia vital: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(true);
  });

  it.each(NON_URGENT_CASES)("no marca alarma en caso común: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(false);
  });

  it("expone el mensaje fijo de urgencia", () => {
    expect(RED_FLAG_MESSAGE).toMatch(/urgencia vital/i);
    expect(RED_FLAG_MESSAGE).toMatch(/Urgencias/);
  });
});
