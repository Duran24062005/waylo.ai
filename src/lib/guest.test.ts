import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  afterReply,
  encodeGuest,
  GUEST_LIMIT,
  GUEST_WAIT_MS,
  guestLimitReached,
  guestUsage,
  readGuest,
} from "@/lib/guest";
import { formatWait } from "@/lib/wait";

const NOW = Date.UTC(2026, 9, 23, 12, 0, 0);

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("guest cookie", () => {
  it("reads back the count it wrote while replies are left", () => {
    for (const count of [0, 1, 4]) {
      expect(readGuest(encodeGuest(count), NOW)).toEqual({ used: count });
    }
  });

  it("counts a visitor with no cookie as having used nothing", () => {
    expect(readGuest(undefined, NOW)).toEqual({ used: 0 });
    expect(readGuest("", NOW)).toEqual({ used: 0 });
  });

  it("keeps the visitor waiting until the signed time", () => {
    const until = NOW + GUEST_WAIT_MS;

    expect(readGuest(encodeGuest(5, until), NOW)).toEqual({ used: 5, resetAt: until });
    expect(readGuest(encodeGuest(5, until), until - 1)).toEqual({ used: 5, resetAt: until });
  });

  it("gives the five replies back once the wait is over", () => {
    const until = NOW + GUEST_WAIT_MS;

    expect(readGuest(encodeGuest(5, until), until)).toEqual({ used: 0 });
    expect(readGuest(encodeGuest(5, until), until + 60_000)).toEqual({ used: 0 });
  });

  it("does not let a visitor shorten the wait by editing the time", () => {
    const [count, , signature] = encodeGuest(5, NOW + GUEST_WAIT_MS).split(".");
    const edited = `${count}.${NOW - 1}.${signature}`;

    const state = readGuest(edited, NOW);

    expect(state.used).toBe(GUEST_LIMIT);
    expect(state.resetAt).toBeGreaterThan(NOW);
  });

  it("counts a cookie edited by hand as used up, so editing never wins replies back", () => {
    const [, until, signature] = encodeGuest(5, NOW + GUEST_WAIT_MS).split(".");

    // Lowering the count while keeping the old signature, a made-up signature, or no signature at all.
    for (const token of [`1.${until}.${signature}`, "0.0.firma-inventada", "0", "0.0", "1.2.3.4"]) {
      expect(readGuest(token, NOW).used).toBe(GUEST_LIMIT);
    }
  });

  it("counts values that are not a sane whole number as used up", () => {
    for (const token of ["-1.0.x", "1.5.0.x", "abc.0.x", "99999999.0.x", "NaN.0.x", "1.-5.x"]) {
      expect(readGuest(token, NOW).used).toBe(GUEST_LIMIT);
    }
  });

  it("does not accept a cookie signed with another secret", () => {
    const token = encodeGuest(3);
    vi.stubEnv("AUTH_SECRET", "otro-secreto");

    expect(readGuest(token, NOW).used).toBe(GUEST_LIMIT);
  });

  describe("a cookie from before the wait existed", () => {
    // That format was "count.signature", signed over "guest:count".
    const legacy = (count: number) =>
      `${count}.${createHmac("sha256", "secreto-de-prueba").update(`guest:${count}`).digest("base64url")}`;

    it("keeps its count while replies are left", () => {
      expect(readGuest(legacy(2), NOW)).toEqual({ used: 2 });
    });

    it("starts the wait now if it was already used up", () => {
      expect(readGuest(legacy(5), NOW)).toEqual({ used: 5, resetAt: NOW + GUEST_WAIT_MS });
    });

    it("rejects a legacy count whose signature does not match", () => {
      const signature = legacy(5).split(".")[1];
      expect(readGuest(`1.${signature}`, NOW).used).toBe(GUEST_LIMIT);
    });
  });
});

describe("guest limit", () => {
  it("allows exactly five free replies", () => {
    expect(GUEST_LIMIT).toBe(5);
    expect(guestLimitReached(4)).toBe(false);
    expect(guestLimitReached(5)).toBe(true);
    expect(guestLimitReached(6)).toBe(true);
  });

  it("waits two hours and thirty minutes", () => {
    expect(GUEST_WAIT_MS).toBe(2.5 * 60 * 60 * 1000);
  });

  it("starts the wait with the fifth reply and not before", () => {
    expect(afterReply(3, NOW).resetAt).toBeUndefined();

    const fifth = afterReply(4, NOW);
    expect(fifth.used).toBe(5);
    expect(fifth.resetAt).toBe(NOW + GUEST_WAIT_MS);
    expect(readGuest(fifth.cookie, NOW)).toEqual({ used: 5, resetAt: NOW + GUEST_WAIT_MS });
  });

  it("describes the usage for the client", () => {
    expect(guestUsage({ used: 2 })).toEqual({ used: 2, limit: 5 });
    expect(guestUsage({ used: 5, resetAt: 99 })).toEqual({ used: 5, limit: 5, resetAt: 99 });
  });
});

describe("formatWait", () => {
  it("writes hours and minutes", () => {
    expect(formatWait(GUEST_WAIT_MS)).toBe("2 h 30 min");
    expect(formatWait(2 * 60 * 60_000)).toBe("2 h");
    expect(formatWait(45 * 60_000)).toBe("45 min");
  });

  it("rounds up so it never promises less than is left", () => {
    expect(formatWait(1)).toBe("1 min");
    expect(formatWait(60_001)).toBe("2 min");
  });

  it("copes with a wait that already ended", () => {
    expect(formatWait(0)).toBe("unos segundos");
    expect(formatWait(-5)).toBe("unos segundos");
  });
});
