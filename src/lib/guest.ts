import { createHmac, timingSafeEqual } from "node:crypto";
import type { GuestUsage } from "@/lib/types";

export const GUEST_COOKIE = "waylo_guest";
export const GUEST_LIMIT = 5;
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function sign(count: number): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET");
  return createHmac("sha256", secret).update(`guest:${count}`).digest("base64url");
}

/** The cookie value for a visitor who has used `count` free replies. The signature stops them from editing it. */
export function encodeGuestCount(count: number): string {
  return `${count}.${sign(count)}`;
}

/**
 * The count in a cookie. No cookie means a new visitor, so 0. A cookie that is there but does not
 * check out was edited, so it counts as used up: editing it must never win back free replies.
 */
export function decodeGuestCount(token: string | undefined): number {
  if (!token) return 0;
  const [rawCount, signature] = token.split(".");
  const count = Number(rawCount);
  if (!signature || !Number.isInteger(count) || count < 0 || count > 10_000) return GUEST_LIMIT;

  const expected = Buffer.from(sign(count));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return GUEST_LIMIT;
  return count;
}

export function guestUsage(used: number): GuestUsage {
  return { used, limit: GUEST_LIMIT };
}

export function guestLimitReached(used: number): boolean {
  return used >= GUEST_LIMIT;
}
