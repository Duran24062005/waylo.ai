import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos y condiciones | Waylo" };

export default function TerminosPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16 text-text">
      <Link href="/login" className="link-anim w-fit font-heading font-semibold">
        Volver
      </Link>
      <h1 className="font-script text-5xl text-title-gradient">Términos</h1>
      <p className="text-body-lg text-text-muted">Este documento está en preparación.</p>
      <p className="text-body text-text">
        Waylo orienta sobre a qué nivel de atención acudir. No diagnostica, no receta y no reemplaza la valoración de
        un profesional de la salud. Si te sientes muy mal, ve a Urgencias.
      </p>
    </main>
  );
}
