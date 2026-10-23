import { describe, expect, it } from "vitest";
import { detectRedFlag, RED_FLAG_MESSAGE, redFlagMessage } from "@/lib/red-flags";

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
  "Tengo dificultades para respirar",
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

  it("expone el mensaje fijo de urgencia exacto de AGENTS.md", () => {
    expect(RED_FLAG_MESSAGE).toBe(
      "Esto requiere atención inmediata. Por favor, acude al centro de Urgencias más cercano o llama de inmediato a la línea de emergencias médicas de tu ciudad.",
    );
  });
});

const URGENT_ENGLISH = [
  "I have a crushing pain in my chest",
  "My chest hurts and I'm sweating",
  "There is tightness in my chest",
  "I can't breathe",
  "I'm having trouble breathing",
  "Shortness of breath that started suddenly",
  "Pain in my left arm and numbness",
  "His face is drooping on one side",
  "She has slurred speech and sudden weakness",
  "He passed out and is unresponsive",
  "My father had a seizure",
  "The bleeding won't stop",
  "Uncontrolled bleeding from the wound",
  "I want to kill myself",
  "I don't want to live anymore",
  "I think I'm having a stroke",
];

const NON_URGENT_ENGLISH = [
  "I have had a headache since yesterday",
  "Mild fever and a runny nose",
  "My knee hurts when I climb stairs",
  "I want to book a general medicine appointment",
  "I have a cough for a week, no shortness of breath",
  "No chest pain, just a sore throat",
];

const URGENT_PORTUGUESE = [
  "Estou com uma dor forte no peito",
  "Sinto aperto no peito e suor frio",
  "Não consigo respirar",
  "Estou com falta de ar",
  "Dor no braço esquerdo e formigamento",
  "Meu pai desmaiou e não responde",
  "Ela teve uma convulsão",
  "Sangramento intenso que não para",
  "Rosto torto e fraqueza repentina",
  "Quero me matar",
  "Não quero mais viver",
  "Acho que estou tendo um avc",
  "Fala arrastada e boca torta",
];

const NON_URGENT_PORTUGUESE = [
  "Estou com dor de cabeça desde ontem",
  "Febre baixa e nariz escorrendo",
  "Meu joelho dói ao subir escadas",
  "Quero marcar uma consulta de medicina geral",
  "Tosse há uma semana, sem falta de ar",
  "Sem dor no peito, só garganta inflamada",
];

describe("detectRedFlag in English", () => {
  it.each(URGENT_ENGLISH)("flags a vital emergency: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(true);
  });

  it.each(NON_URGENT_ENGLISH)("does not flag a common case: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(false);
  });
});

describe("detectRedFlag in Portuguese", () => {
  it.each(URGENT_PORTUGUESE)("flags a vital emergency: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(true);
  });

  it.each(NON_URGENT_PORTUGUESE)("does not flag a common case: %s", (text) => {
    expect(detectRedFlag(text).matched).toBe(false);
  });
});

describe("redFlagMessage", () => {
  it("keeps the exact Spanish text and has the same message in the other languages", () => {
    expect(redFlagMessage("es")).toBe(RED_FLAG_MESSAGE);
    expect(redFlagMessage("en")).toContain("Emergency Care");
    expect(redFlagMessage("pt")).toContain("Urgência");
  });
});
