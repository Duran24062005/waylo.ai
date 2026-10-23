import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeGuestCount, encodeGuestCount, GUEST_LIMIT, guestLimitReached, guestUsage } from "@/lib/guest";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
});

describe("guest cookie", () => {
  it("reads back the count it wrote", () => {
    for (const count of [0, 1, 4, 5]) {
      expect(decodeGuestCount(encodeGuestCount(count))).toBe(count);
    }
  });

  it("counts a visitor with no cookie as having used nothing", () => {
    expect(decodeGuestCount(undefined)).toBe(0);
    expect(decodeGuestCount("")).toBe(0);
  });

  it("counts a cookie edited by hand as used up, so editing never wins replies back", () => {
    const signature = encodeGuestCount(5).split(".")[1];

    // Lowering the count while keeping the old signature, a made-up signature, or no signature at all.
    expect(decodeGuestCount(`1.${signature}`)).toBe(GUEST_LIMIT);
    expect(decodeGuestCount("0.firma-inventada")).toBe(GUEST_LIMIT);
    expect(decodeGuestCount("0")).toBe(GUEST_LIMIT);
  });

  it("counts values that are not a sane whole number as used up", () => {
    for (const token of ["-1.x", "1.5.x", "abc.x", "99999999.x", "NaN.x"]) {
      expect(decodeGuestCount(token)).toBe(GUEST_LIMIT);
    }
  });

  it("does not accept a cookie signed with another secret", () => {
    const token = encodeGuestCount(3);
    vi.stubEnv("AUTH_SECRET", "otro-secreto");

    expect(decodeGuestCount(token)).toBe(GUEST_LIMIT);
  });
});

describe("guest limit", () => {
  it("allows exactly five free replies", () => {
    expect(GUEST_LIMIT).toBe(5);
    expect(guestLimitReached(4)).toBe(false);
    expect(guestLimitReached(5)).toBe(true);
    expect(guestLimitReached(6)).toBe(true);
  });

  it("describes the usage for the client", () => {
    expect(guestUsage(2)).toEqual({ used: 2, limit: 5 });
  });
});
