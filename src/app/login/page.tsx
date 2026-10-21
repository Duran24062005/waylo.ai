import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Entrar | Navegador del paciente",
};

export default function LoginPage() {
  return <LoginForm />;
}
