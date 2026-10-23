import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return { title: t.meta.titles.signup };
}

export default async function RegistroPage() {
  if (await getSession()) redirect("/chat");
  return <AuthPanel initialMode="registro" />;
}
