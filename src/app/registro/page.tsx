import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default async function RegistroPage() {
  if (await getSession()) redirect("/chat");
  return <AuthPanel initialMode="registro" />;
}
