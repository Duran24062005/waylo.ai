import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return { title: t.meta.titles.login };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Already signed in: "Ir al Chat" goes straight through.
  if (await getSession()) redirect("/chat");
  const { error } = await searchParams;
  return <AuthPanel initialMode="login" googleError={error === "google"} />;
}
