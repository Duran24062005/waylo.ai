/** The two phrases of a wait that are words, not numbers. The numbers and units read the same in every language. */
export interface WaitWords {
  fewSeconds: string;
  lessThanAMinute: string;
}

const SPANISH_WORDS: WaitWords = { fewSeconds: "unos segundos", lessThanAMinute: "menos de 1 min" };

/** A wait in words: "2 h 30 min", "45 min". Rounds up, so it never promises less than is left. */
export function formatWait(ms: number, words: WaitWords = SPANISH_WORDS): string {
  if (ms <= 0) return words.fewSeconds;
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 1) return words.lessThanAMinute;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/** How long ago something happened, in a language ("hace 5 minutos", "5 minutes ago"). */
export function formatAgo(ms: number, locale: string, now = Date.now()): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = Math.round((ms - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return formatter.format(0, "second");
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86400), "day");
}
