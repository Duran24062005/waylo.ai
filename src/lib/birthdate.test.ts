import { describe, expect, it } from "vitest";
import {
  birthYearOptions,
  daysInMonth,
  isLeapYear,
  isValidBirthDate,
  MAX_AGE_YEARS,
} from "@/lib/birthdate";

// Fixed reference date so the tests never depend on the real clock: 15 June 2026.
const TODAY = new Date(2026, 5, 15);

const check = (day: number | null, month: number | null, year: number | null) =>
  isValidBirthDate({ day, month, year }, TODAY);

describe("isLeapYear", () => {
  it("treats years divisible by 4 as leap", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
  });

  it("skips century years unless divisible by 400", () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });
});

describe("daysInMonth", () => {
  it("returns the length of every month in a common year", () => {
    const lengths = Array.from({ length: 12 }, (_, i) => daysInMonth(i + 1, 2023));
    expect(lengths).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  });

  it("gives February 29 days in leap years only", () => {
    expect(daysInMonth(2, 2024)).toBe(29);
    expect(daysInMonth(2, 2000)).toBe(29);
    expect(daysInMonth(2, 1900)).toBe(28);
  });

  it("returns 0 for a month that does not exist", () => {
    expect(daysInMonth(0, 2024)).toBe(0);
    expect(daysInMonth(13, 2024)).toBe(0);
    expect(daysInMonth(1.5, 2024)).toBe(0);
  });
});

describe("isValidBirthDate", () => {
  it("accepts a normal date and returns the age", () => {
    expect(check(10, 3, 1990)).toEqual({ valid: true, age: 36 });
  });

  it("counts the age before and on the birthday", () => {
    expect(check(16, 6, 1990)).toEqual({ valid: true, age: 35 });
    expect(check(15, 6, 1990)).toEqual({ valid: true, age: 36 });
  });

  it("asks for the missing parts", () => {
    expect(check(null, 3, 1990)).toEqual({ valid: false, error: "incomplete" });
    expect(check(10, null, 1990)).toEqual({ valid: false, error: "incomplete" });
    expect(check(10, 3, null)).toEqual({ valid: false, error: "incomplete" });
  });

  it("accepts Feb 29 only in leap years", () => {
    expect(check(29, 2, 2024)).toEqual({ valid: true, age: 2 });
    expect(check(29, 2, 2023)).toEqual({ valid: false, error: "invalid" });
    expect(check(29, 2, 1900)).toEqual({ valid: false, error: "invalid" });
    expect(check(29, 2, 2000)).toEqual({ valid: true, age: 26 });
  });

  it("rejects days past the end of the month", () => {
    expect(check(31, 4, 1990)).toEqual({ valid: false, error: "invalid" });
    expect(check(31, 1, 1990)).toEqual({ valid: true, age: 36 });
  });

  it("rejects parts outside their range", () => {
    expect(check(0, 3, 1990)).toEqual({ valid: false, error: "invalid" });
    expect(check(10, 13, 1990)).toEqual({ valid: false, error: "invalid" });
    expect(check(10, 0, 1990)).toEqual({ valid: false, error: "invalid" });
    expect(check(10.5, 3, 1990)).toEqual({ valid: false, error: "invalid" });
    expect(check(10, 3, 0)).toEqual({ valid: false, error: "invalid" });
    expect(check(10, 3, Number.NaN)).toEqual({ valid: false, error: "invalid" });
  });

  it("rejects future dates but allows today", () => {
    expect(check(16, 6, 2026)).toEqual({ valid: false, error: "future" });
    expect(check(1, 7, 2026)).toEqual({ valid: false, error: "future" });
    expect(check(1, 1, 2027)).toEqual({ valid: false, error: "future" });
    expect(check(15, 6, 2026)).toEqual({ valid: true, age: 0 });
  });

  it("allows an age of exactly 120 and rejects 121", () => {
    expect(MAX_AGE_YEARS).toBe(120);
    expect(check(15, 6, 1906)).toEqual({ valid: true, age: 120 });
    expect(check(16, 6, 1905)).toEqual({ valid: true, age: 120 });
    expect(check(15, 6, 1905)).toEqual({ valid: false, error: "too_old" });
    expect(check(1, 1, 1800)).toEqual({ valid: false, error: "too_old" });
  });
});

describe("birthYearOptions", () => {
  it("lists the current year down to 120 years back", () => {
    const years = birthYearOptions(TODAY);
    expect(years).toHaveLength(121);
    expect(years[0]).toBe(2026);
    expect(years.at(-1)).toBe(1906);
  });
});
