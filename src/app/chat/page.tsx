import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChatApp } from "@/components/ChatApp";
import { isSection } from "@/components/settings/sections";
import { getMessages } from "@/i18n/server";
import { GUEST_COOKIE, guestUsage, readGuest } from "@/lib/guest";
import { displayName } from "@/lib/profile";
import { getSession } from "@/lib/session";
import type { AccountUsage, GuestUsage } from "@/lib/types";
import { readUsage, usageStatus } from "@/lib/usage";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return { title: t.meta.titles.chat };
}

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ settings?: string }> }) {
  const { settings } = await searchParams;
  const session = await getSession();

  // Anyone can open the chat. Visitors without an account get a few free replies, counted in a signed cookie.
  let guest: GuestUsage | undefined;
  // Accounts have a daily and a monthly allowance, kept in the database.
  let usage: AccountUsage | undefined;
  if (session) {
    try {
      usage = usageStatus(await readUsage(session.id), Date.now());
    } catch {
      // The chat still opens; the server checks the allowance again on every reply.
    }
  } else {
    try {
      guest = guestUsage(readGuest((await cookies()).get(GUEST_COOKIE)?.value, Date.now()));
    } catch {
      guest = guestUsage({ used: 0 });
    }
  }

  return (
    <ChatApp
      initialSettings={isSection(settings) ? settings : undefined}
      nombre={session ? displayName(session) : undefined}
      userId={session?.id}
      guest={guest}
      usage={usage}
    />
  );
}
