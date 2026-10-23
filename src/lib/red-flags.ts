import type { Locale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";

/** The fixed alarm text, in Spanish. Use `redFlagMessage` to get it in another language. */
export const RED_FLAG_MESSAGE = messages.es.server.redFlag;

/** The fixed alarm text in a language. */
export function redFlagMessage(locale: Locale): string {
  return messages[locale].server.redFlag;
}

interface RedFlagRule {
  id: string;
  pattern: RegExp;
}

// The alarm is checked in every language at once, whatever language the app is set to: a person in distress may
// well write in the one they feel most at ease with. Text is lowercased and stripped of accents and punctuation
// first (see normalizeText), so an English "can't" reads "can t".
const RULES: RedFlagRule[] = [
  // Spanish.
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
      /\b(no puedo respirar|no puedo respirar bien|me ahogo|me estoy ahogando|asfixia|asfixi[aá]ndome|falta de aire|me falta el aire|dificultad(?:es)? para respirar|dificultad(?:es)? respiratoria(?:s)?|no me entra el aire|no me llega el aire|sensaci[oó]n de ahogo|jadeo grave|respiraci[oó]n muy dif[ií]cil|apenas puedo respirar|se me corta la respiraci[oó]n)\b/,
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

  // English.
  {
    id: "pecho",
    pattern:
      /\bchest\b[\s\S]{0,40}\b(pain|pains|hurts?|aching|tight(?:ness)?|pressure|burning|squeez\w*|crushing|heavy|heaviness|discomfort)\b|\b(pain|pains|hurts?|aching|pressure|tightness|burning|squeez\w*|crushing|discomfort)\b[\s\S]{0,40}\bchest\b/,
  },
  {
    id: "brazo-izquierdo",
    pattern:
      /\bleft\s+(arm|shoulder)\b[\s\S]{0,30}\b(pain|hurts?|aching|numb\w*|tingl\w*|heavy|heaviness|weak\w*)\b|\b(pain|hurts?|aching|numb\w*|tingl\w*)\b[\s\S]{0,30}\bleft\s+(arm|shoulder)\b/,
  },
  {
    id: "respiracion",
    pattern:
      /\b(can t breathe|can not breathe|cannot breathe|unable to breathe|not able to breathe|trouble breathing|difficulty breathing|hard to breathe|short(?:ness)? of breath|gasping for (?:air|breath)|struggling to breathe|can t catch my breath|am choking|i m choking|suffocating)\b/,
  },
  {
    id: "paralisis",
    pattern:
      /\b(paralyz\w*|paralys\w*|face (?:is )?droop\w*|drooping face|droopy face|facial droop\w*|one side of (?:my|the) (?:body|face)|sudden weakness|sudden numbness|can t move (?:my )?(?:arm|leg|face|side)|having a stroke|think i m having a stroke)\b/,
  },
  {
    id: "habla",
    pattern:
      /\b(slurred speech|speech (?:is )?slurred|can t speak|cannot speak|can t talk|trouble speaking|difficulty speaking|words (?:are )?(?:coming out )?(?:wrong|jumbled|mixed up)|confused speech)\b/,
  },
  {
    id: "sangrado",
    pattern:
      /\b(uncontrolled bleeding|severe bleeding|heavy bleeding|bleeding (?:heavily|a lot|profusely|badly|non stop)|bleeding won t stop|won t stop bleeding|can t stop (?:the )?bleeding|hemorrhag\w*|blood (?:is )?(?:gushing|pouring)|losing a lot of blood)\b/,
  },
  {
    id: "conciencia",
    pattern:
      /\b(lost consciousness|passed out|fainted|blacked out|collapsed|unconscious|unresponsive|won t wake up|not waking up|seizure|seizing|convuls\w*)\b/,
  },
  {
    id: "autolesion",
    pattern:
      /\b(want to (?:die|kill myself|end it all|hurt myself|harm myself)|kill myself|killing myself|suicid\w*|self harm|hurt myself|end my life|don t want to live|going to end it)\b/,
  },

  // Portuguese.
  {
    id: "pecho",
    pattern:
      /\b(dor|doi|dói|pressão|pressao|aperto|queimação|queimacao|peso|desconforto|ardência|ardencia|pontada)\b[\s\S]{0,40}\b(peito|tórax|torax|esterno|precordial)\b|\b(peito|tórax|torax)\b[\s\S]{0,40}\b(doi|dói|dor|pressão|pressao|aperto|queimação|queimacao|peso|apertado|pontada)\b|\bdor torácica\b|\baperto no peito\b|\bdor no peito\b/,
  },
  {
    id: "brazo-izquierdo",
    pattern:
      /\b(braço|braco|ombro)\s+esquerdo\b[\s\S]{0,30}\b(doi|dói|dor|dormente|dormência|formig\w*|adormec\w*|pesad\w*)\b|\b(doi|dói|dor|dormência|dormencia|formig\w*|adormec\w*)\b[\s\S]{0,30}\b(braço|braco|ombro)\s+esquerdo\b/,
  },
  {
    id: "respiracion",
    pattern:
      /\b(não consigo respirar|nao consigo respirar|não estou conseguindo respirar|nao estou conseguindo respirar|falta de ar|estou sem ar|dificuldade (?:para|de|em) respirar|dificuldade respiratória|dificuldade respiratoria|sufoc\w*|me afogando|não entra ar|nao entra ar|mal consigo respirar|respiração muito difícil|respiracao muito dificil)\b/,
  },
  {
    id: "paralisis",
    pattern:
      /\b(paralisia|paralisad[oa]|não consigo mexer|nao consigo mexer|rosto torto|boca torta|rosto caído|rosto caido|fraqueza repentina|um lado do corpo|avc|derrame)\b/,
  },
  {
    id: "habla",
    pattern:
      /\b(não consigo falar|nao consigo falar|fala arrastada|língua enrolada|lingua enrolada|dificuldade (?:para|de|em) falar|fala embolada|não consigo articular|nao consigo articular)\b/,
  },
  {
    id: "sangrado",
    pattern:
      /\b(sangramento (?:incontrolável|incontrolavel|intenso|grave|abundante|que não para|que nao para)|sangrando muito|sangra muito|hemorragia|não para de sangrar|nao para de sangrar|perda de sangue (?:grande|intensa|abundante)|sangue jorrando)\b/,
  },
  {
    id: "conciencia",
    pattern:
      /\b(perda de consciência|perda de consciencia|perdi a consciência|perdi a consciencia|desmaiou|desmaiei|desmaio|inconsciente|não responde|nao responde|não reage|nao reage|convulsão|convulsao|convulsões|convulsoes|convulsionando|não acorda|nao acorda|síncope|sincope)\b/,
  },
  {
    id: "autolesion",
    pattern:
      /\b(quero (?:morrer|me matar|me suicidar|me machucar|me cortar|acabar com tudo|acabar com a minha vida)|pensamentos? de (?:suicídio|suicidio|morte|autolesão|autolesao)|vou me matar|vou me suicidar|não quero mais viver|nao quero mais viver|ideias? de suicídio|ideias? de suicidio)\b/,
  },
];

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fold(pattern: RegExp): RegExp {
  const source = pattern.source.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return new RegExp(source, "i");
}

const FOLDED_RULES = RULES.map((rule) => ({
  id: rule.id,
  pattern: fold(rule.pattern),
}));

export function detectRedFlag(input: string): { matched: boolean; ruleId?: string } {
  const text = normalizeText(input);
  if (!text) return { matched: false };
  // Saying a symptom is absent ("no chest pain") is not an alarm.
  const negated = text
    .replace(/\b(sin|no hay|no tengo|niega)\s+(falta de aire|dificultad para respirar|dolor en el pecho|sangrado|paralisis)\b/g, " ")
    .replace(
      /\b(no|without|denies|don t have|do not have|never had|no history of)\s+(shortness of breath|chest pain|difficulty breathing|trouble breathing|bleeding|paralysis)\b/g,
      " ",
    )
    .replace(/\b(sem|nao tenho|nao ha|nega)\s+(falta de ar|dor no peito|dificuldade (?:para|de|em) respirar|sangramento|paralisia)\b/g, " ")
    .trim();

  for (const rule of FOLDED_RULES) {
    if (rule.pattern.test(negated)) {
      return { matched: true, ruleId: rule.id };
    }
  }

  return { matched: false };
}
