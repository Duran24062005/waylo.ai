import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthPanel initialMode="login" googleError={error === "google"} />;
}
