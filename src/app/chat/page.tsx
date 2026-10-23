import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChatApp } from "@/components/ChatApp";
import { GUEST_COOKIE, guestUsage, readGuest } from "@/lib/guest";
import { getSession } from "@/lib/session";
import type { GuestUsage } from "@/lib/types";

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ChatPage() {
  const session = await getSession();

  // Anyone can open the chat. Visitors without an account get a few free replies, counted in a signed cookie.
  let guest: GuestUsage | undefined;
  if (!session) {
    try {
      guest = guestUsage(readGuest((await cookies()).get(GUEST_COOKIE)?.value, Date.now()));
    } catch {
      guest = guestUsage({ used: 0 });
    }
  }

  return <ChatApp nombre={session?.nombre} userId={session?.id} guest={guest} />;
}
