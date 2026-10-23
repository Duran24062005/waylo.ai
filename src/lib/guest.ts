import { createHmac, timingSafeEqual } from "node:crypto";
import type { GuestUsage } from "@/lib/types";

export const GUEST_COOKIE = "waylo_guest";
export const GUEST_LIMIT = 5;
/** How long a visitor who used up the free replies waits to get them back. */
export const GUEST_WAIT_MS = 2.5 * 60 * 60 * 1000;
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function matches(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** What the server knows about a visitor: replies used, and when they get them back if none are left. */
export interface GuestState {
  used: number;
  /** Epoch milliseconds. Only set while the visitor is waiting. */
  resetAt?: number;
}

/** The cookie value. `until` is when the wait ends; 0 while the visitor still has replies. The signature stops edits. */
export function encodeGuest(count: number, until = 0): string {
  return `${count}.${until}.${sign(`guest:${count}:${until}`)}`;
}

/**
 * What a cookie says about the visitor right now.
 * - No cookie: a new visitor, nothing used.
 * - A cookie that was edited: treated as used up and waiting, so editing never wins replies back.
 * - Used up, but the wait is over: the replies are back.
 */
export function readGuest(token: string | undefined, now: number): GuestState {
  if (!token) return { used: 0 };

  const tampered: GuestState = { used: GUEST_LIMIT, resetAt: now + GUEST_WAIT_MS };
  const parts = token.split(".");

  // The first version of the cookie had no wait, only "count.signature". Those visitors keep their count.
  if (parts.length === 2) {
    const count = Number(parts[0]);
    if (!Number.isInteger(count) || count < 0 || count > 10_000 || !matches(`guest:${count}`, parts[1])) return tampered;
    return count >= GUEST_LIMIT ? tampered : { used: count };
  }

  if (parts.length !== 3) return tampered;
  const count = Number(parts[0]);
  const until = Number(parts[1]);
  if (!Number.isInteger(count) || count < 0 || count > 10_000) return tampered;
  if (!Number.isInteger(until) || until < 0) return tampered;
  if (!matches(`guest:${count}:${until}`, parts[2])) return tampered;

  if (count < GUEST_LIMIT) return { used: count };
  return until > now ? { used: count, resetAt: until } : { used: 0 };
}

/** The state after one more AI reply, with the cookie that records it. The fifth reply starts the wait. */
export function afterReply(used: number, now: number): GuestState & { cookie: string } {
  const count = used + 1;
  const resetAt = count >= GUEST_LIMIT ? now + GUEST_WAIT_MS : undefined;
  return { used: count, resetAt, cookie: encodeGuest(count, resetAt ?? 0) };
}

export function guestUsage(state: GuestState): GuestUsage {
  return { used: state.used, limit: GUEST_LIMIT, ...(state.resetAt ? { resetAt: state.resetAt } : {}) };
}

export function guestLimitReached(used: number): boolean {
  return used >= GUEST_LIMIT;
}
