/** A wait in words: "2 h 30 min", "45 min", "menos de 1 min". Rounds up, so it never promises less than is left. */
export function formatWait(ms: number): string {
  if (ms <= 0) return "unos segundos";
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 1) return "menos de 1 min";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
