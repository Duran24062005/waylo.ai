import { describe, expect, it } from "vitest";
import {
  withReply,
  bogotaDay,
  bogotaMonth,
  DAILY_LIMIT,
  DAILY_WAIT_MS,
  MONTHLY_LIMIT,
  nextMonthStart,
  normalizeUsage,
  usageStatus,
  type UsageRow,
} from "@/lib/usage";

// 2026-10-23 12:00 in Bogotá (UTC-5) is 17:00 UTC.
const NOON = Date.UTC(2026, 9, 23, 17, 0, 0);
const HOUR = 60 * 60 * 1000;

const row = (overrides: Partial<UsageRow> = {}): UsageRow => ({
  dia: "2026-10-23",
  usadasDia: 0,
  bloqueadoHasta: null,
  mes: "2026-10",
  usadasMes: 0,
  ...overrides,
});

describe("Colombian days and months", () => {
  it("counts the day in Bogotá time, not UTC", () => {
    // 02:00 UTC on the 24th is still the evening of the 23rd in Bogotá.
    expect(bogotaDay(Date.UTC(2026, 9, 24, 2, 0, 0))).toBe("2026-10-23");
    expect(bogotaDay(Date.UTC(2026, 9, 24, 5, 0, 0))).toBe("2026-10-24");
  });

  it("finds the month and the start of the next one", () => {
    expect(bogotaMonth(NOON)).toBe("2026-10");
    expect(nextMonthStart(NOON)).toBe(Date.UTC(2026, 10, 1, 5, 0, 0));
    // December rolls into the next year.
    expect(nextMonthStart(Date.UTC(2026, 11, 15, 12, 0, 0))).toBe(Date.UTC(2027, 0, 1, 5, 0, 0));
  });

  it("does not move to next month until midnight in Bogotá", () => {
    const lastMinute = Date.UTC(2026, 10, 1, 4, 59, 0);
    expect(bogotaMonth(lastMinute)).toBe("2026-10");
    expect(bogotaMonth(Date.UTC(2026, 10, 1, 5, 0, 0))).toBe("2026-11");
  });
});

describe("limits", () => {
  it("are 100 a day and 2000 a month, with a 12 hour wait", () => {
    expect(DAILY_LIMIT).toBe(100);
    expect(MONTHLY_LIMIT).toBe(2000);
    expect(DAILY_WAIT_MS).toBe(12 * HOUR);
  });
});

describe("usageStatus", () => {
  it("starts empty for an account with no record", () => {
    expect(usageStatus(null, NOON)).toEqual({ dayUsed: 0, dayLimit: 100, monthUsed: 0, monthLimit: 2000, blocked: null });
  });

  it("reports the counts and no wait while replies are left", () => {
    const status = usageStatus(row({ usadasDia: 99, usadasMes: 500 }), NOON);
    expect(status).toMatchObject({ dayUsed: 99, monthUsed: 500, blocked: null });
  });

  it("starts the day again at midnight in Bogotá", () => {
    const yesterday = row({ dia: "2026-10-22", usadasDia: 60, usadasMes: 160 });
    expect(usageStatus(yesterday, NOON)).toMatchObject({ dayUsed: 0, monthUsed: 160 });
  });

  it("starts the month again when the month changes", () => {
    const lastMonth = row({ mes: "2026-09", usadasMes: 1999, dia: "2026-09-30", usadasDia: 5 });
    expect(usageStatus(lastMonth, NOON)).toMatchObject({ dayUsed: 0, monthUsed: 0, blocked: null });
  });
});

describe("withReply", () => {
  it("counts a reply for the day and the month", () => {
    expect(withReply(null, NOON)).toEqual(row({ usadasDia: 1, usadasMes: 1 }));
    expect(withReply(row({ usadasDia: 4, usadasMes: 40 }), NOON)).toMatchObject({ usadasDia: 5, usadasMes: 41 });
  });

  it("starts the 12 hour wait with the hundredth reply of the day, and not before", () => {
    expect(withReply(row({ usadasDia: 98 }), NOON).bloqueadoHasta).toBeNull();

    const hundredth = withReply(row({ usadasDia: 99, usadasMes: 99 }), NOON);
    expect(hundredth.usadasDia).toBe(100);
    expect(hundredth.bloqueadoHasta).toBe(NOON + 12 * HOUR);
    expect(usageStatus(hundredth, NOON).blocked).toEqual({ scope: "day", resetAt: NOON + 12 * HOUR });
  });

  it("keeps the wait running, and its end time, while the account waits", () => {
    const waiting = row({ usadasDia: 100, bloqueadoHasta: NOON + 12 * HOUR });
    expect(usageStatus(waiting, NOON + 6 * HOUR).blocked).toEqual({ scope: "day", resetAt: NOON + 12 * HOUR });
  });

  it("gives the day's replies back when the wait ends", () => {
    const waiting = row({ usadasDia: 100, usadasMes: 300, bloqueadoHasta: NOON + 12 * HOUR });
    const later = NOON + 12 * HOUR;

    expect(usageStatus(waiting, later)).toMatchObject({ dayUsed: 0, monthUsed: 300, blocked: null });
    expect(withReply(waiting, later)).toMatchObject({ usadasDia: 1, usadasMes: 301, bloqueadoHasta: null });
  });

  it("does not let midnight cut the wait short", () => {
    // The hundredth reply at 20:00 Bogotá; at 01:00 the next day the wait still has 7 hours to run.
    const at20 = Date.UTC(2026, 9, 24, 1, 0, 0);
    const waiting = withReply(row({ usadasDia: 99 }), at20);
    const afterMidnight = Date.UTC(2026, 9, 24, 6, 0, 0);

    expect(bogotaDay(afterMidnight)).toBe("2026-10-24");
    expect(usageStatus(waiting, afterMidnight).blocked).toMatchObject({ scope: "day" });
    expect(normalizeUsage(waiting, afterMidnight).usadasDia).toBe(100);
  });
});

describe("the monthly limit", () => {
  it("blocks until the first moment of next month", () => {
    const status = usageStatus(row({ usadasMes: 2000, usadasDia: 10 }), NOON);

    expect(status.blocked).toEqual({ scope: "month", resetAt: nextMonthStart(NOON) });
  });

  it("is not blocked one reply short", () => {
    expect(usageStatus(row({ usadasMes: 1999 }), NOON).blocked).toBeNull();
  });

  it("wins over the daily wait, which is shorter", () => {
    const both = row({ usadasMes: 2000, usadasDia: 100, bloqueadoHasta: NOON + 12 * HOUR });
    expect(usageStatus(both, NOON).blocked?.scope).toBe("month");
  });

  it("gives the replies back on the first day of the next month", () => {
    const status = usageStatus(row({ usadasMes: 2000 }), nextMonthStart(NOON));
    expect(status).toMatchObject({ monthUsed: 0, blocked: null });
  });
});
