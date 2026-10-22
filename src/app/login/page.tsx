import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Already signed in: "Ir al Chat" goes straight through.
  if (await getSession()) redirect("/chat");
  const { error } = await searchParams;
  return <AuthPanel initialMode="login" googleError={error === "google"} />;
}
