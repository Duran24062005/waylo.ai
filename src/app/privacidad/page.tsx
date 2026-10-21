import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16 text-text">
      <Link href="/login" className="link-anim w-fit font-heading font-semibold">
        Volver
      </Link>
      <h1 className="font-script text-5xl text-title-gradient">Privacidad</h1>
      <p className="text-body-lg text-text-muted">
        Este documento está en preparación. Mientras tanto, esto es lo que Waylo guarda cuando creas una cuenta:
      </p>
      <ul className="list-disc space-y-2 pl-6 text-body text-text">
        <li>Tu nombre (o la primera parte de tu correo si no lo escribes) y tu correo.</li>
        <li>Tu contraseña, solo como un código cifrado que no se puede leer.</li>
        <li>Tu fecha de nacimiento y el momento en que autorizaste guardar tus datos.</li>
      </ul>
      <p className="text-body text-text-muted">Solo se usan para tu cuenta. Los mensajes del chat no se guardan en tu cuenta.</p>
    </main>
  );
}
