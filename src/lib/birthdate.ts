export const MAX_AGE_YEARS = 120;

export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Month is 1-12. A null part means the person has not chosen it yet. */
export interface BirthDateInput {
  day: number | null;
  month: number | null;
  year: number | null;
}

export type BirthDateError = "incomplete" | "invalid" | "future" | "too_old";

export type BirthDateResult =
  | { valid: true; age: number }
  | { valid: false; error: BirthDateError };

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Month is 1-12. Returns 0 for a month outside that range. */
export function daysInMonth(month: number, year: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Years to offer in a year select, newest first. */
export function birthYearOptions(today: Date): number[] {
  const current = today.getFullYear();
  return Array.from({ length: MAX_AGE_YEARS + 1 }, (_, i) => current - i);
}

// Compared as numbers instead of through Date, which maps years 0-99 to 1900-1999.
const dateKey = (year: number, month: number, day: number) => year * 10_000 + month * 100 + day;

export function isValidBirthDate(input: BirthDateInput, today: Date): BirthDateResult {
  const { day, month, year } = input;
  if (day === null || month === null || year === null) {
    return { valid: false, error: "incomplete" };
  }
  if (![day, month, year].every(Number.isInteger) || year < 1 || day < 1 || day > daysInMonth(month, year)) {
    return { valid: false, error: "invalid" };
  }

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  if (dateKey(year, month, day) > dateKey(todayYear, todayMonth, todayDay)) {
    return { valid: false, error: "future" };
  }

  const hadBirthdayThisYear = dateKey(0, month, day) <= dateKey(0, todayMonth, todayDay);
  const age = todayYear - year - (hadBirthdayThisYear ? 0 : 1);
  if (age > MAX_AGE_YEARS) {
    return { valid: false, error: "too_old" };
  }

  return { valid: true, age };
}
