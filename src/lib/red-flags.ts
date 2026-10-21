export const RED_FLAG_MESSAGE =
  "Esto puede ser una urgencia vital. Por favor, acude de inmediato al centro de salud/Urgencias más cercano o comunícate con la línea de emergencias médicas de tu localidad.";

interface RedFlagRule {
  id: string;
  pattern: RegExp;
}

const RULES: RedFlagRule[] = [
  {
    id: "pecho",
    pattern:
      /\b(dolor|duele|opresi[oó]n|presi[oó]n|peso|ardor|quemaz[oó]n|punzada|apret[oó]n|molestia)\b[\s\S]{0,40}\b(pecho|t[oó]rax|torac|estern[oó]n|precordial)\b|\b(pecho|t[oó]rax|torac)\b[\s\S]{0,40}\b(duele|dolor|opresi[oó]n|presi[oó]n|peso|ardor|quemaz[oó]n|apretad[oa]|punzada)\b|\bdolor tor[aá]cico\b|\bopresi[oó]n en el pecho\b|\bme aprieta el pecho\b/,
  },
  {
    id: "brazo-izquierdo",
    pattern:
      /\b(brazo|hombro)\s+izquierd[oa]\b[\s\S]{0,30}\b(duele|dolor|adormec|hormigue|entumec|pesadez)\b|\b(duele|dolor|adormec|hormigue|entumec)\b[\s\S]{0,30}\b(brazo|hombro)\s+izquierd[oa]\b|\bdolor (en el |del )?brazo izquierdo\b/,
  },
  {
    id: "respiracion",
    pattern:
      /\b(no puedo respirar|no puedo respirar bien|me ahogo|me estoy ahogando|asfixia|asfixi[aá]ndome|falta de aire|me falta el aire|dificultad para respirar|dificultad respiratoria|no me entra el aire|no me llega el aire|sensaci[oó]n de ahogo|jadeo grave|respiraci[oó]n muy dif[ií]cil|apenas puedo respirar|se me corta la respiraci[oó]n)\b/,
  },
  {
    id: "paralisis",
    pattern:
      /\b(par[aá]lisis|paralizad[oa]|no puedo mover|se me cay[oó] la cara|cara torcida|boca torcida|desviaci[oó]n de la boca|debilidad repentina|se me durmi[oó] un lado|no siento un lado|un lado del cuerpo|lado izquierdo del cuerpo|lado derecho del cuerpo|hemiplejia|cara ca[ií]da)\b/,
  },
  {
    id: "habla",
    pattern:
      /\b(no puedo hablar|no me salen las palabras|se me traba la lengua|hablo raro|alteraci[oó]n del habla|dificultad para hablar|lengua trabada|palabras enredadas|no articulo|habla arrastrada|confusi[oó]n al hablar)\b/,
  },
  {
    id: "sangrado",
    pattern:
      /\b(sangrado (incontrolable|profuso|masivo|que no para|abundante)|sangra (mucho|sin parar|a chorros)|hemorragia|no para de sangrar|estoy desangr[aá]ndome|sangre a borbotones|p[eé]rdida de sangre (grande|masiva|abundante)|herida que no deja de sangrar)\b/,
  },
  {
    id: "conciencia",
    pattern:
      /\b(p[eé]rdida del conocimiento|perdi[oó] el conocimiento|se desmay[oó]|desmayo|inconsciente|no responde|no reacciona|convulsio?n|est[aá] convulsionando|convulsion[oó]|no despierta|qued[oó] inconsciente|s[ií]ncope)\b/,
  },
  {
    id: "autolesion",
    pattern:
      /\b(quiero (morirme|matarme|suicidarme|hacerme da[nñ]o|acabar con todo)|pensamientos de (autolesi[oó]n|suicidio|muerte)|me quiero (matar|hacer da[nñ]o|cortar)|ideas de suicidio|no quiero seguir viviendo|voy a (matarme|suicidarme|hacerme da[nñ]o))\b/,
  },
];

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fold(pattern: RegExp): RegExp {
  const source = pattern.source.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return new RegExp(source, "i");
}

const FOLDED_RULES = RULES.map((rule) => ({
  id: rule.id,
  pattern: fold(rule.pattern),
}));

export function detectRedFlag(input: string): { matched: boolean; ruleId?: string } {
  const text = normalizeText(input);
  if (!text) return { matched: false };
  const negated = text
    .replace(/\b(sin|no hay|no tengo|niega)\s+(falta de aire|dificultad para respirar|dolor en el pecho|sangrado|paralisis)\b/g, " ")
    .trim();

  for (const rule of FOLDED_RULES) {
    if (rule.pattern.test(negated)) {
      return { matched: true, ruleId: rule.id };
    }
  }

  return { matched: false };
}
