import type { Metadata } from "next";
import { RegistroForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Crear cuenta | Navegador del paciente",
};

export default function RegistroPage() {
  return <RegistroForm />;
}
