import type { Metadata } from "next";
import { ChatApp } from "@/components/ChatApp";

export const metadata: Metadata = {
  title: "Chat | Navegador del paciente",
};

export default function ChatPage() {
  return <ChatApp />;
}
