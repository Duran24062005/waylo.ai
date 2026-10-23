import { redirect } from "next/navigation";
import { isSection } from "@/components/settings/sections";

/** The settings are a window over the chat now. The old address still works: it opens the chat with that window. */
export default async function ConfiguracionPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  redirect(`/chat?settings=${isSection(s) ? s : "general"}`);
}
