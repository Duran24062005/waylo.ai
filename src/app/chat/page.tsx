import type { Metadata } from "next";
import { ChatApp } from "@/components/ChatApp";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ChatPage() {
  const session = await getSession();
  return <ChatApp nombre={session?.nombre} />;
}
