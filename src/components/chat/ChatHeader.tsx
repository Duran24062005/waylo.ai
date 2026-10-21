import { Mascot, type MascotState } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme";

export function ChatHeader({ mascotState }: { mascotState: MascotState }) {
  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption font-bold uppercase tracking-wide text-accent">Sistema de salud</p>
        <ThemeToggle />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Mascot state={mascotState} size={56} className="shrink-0" />
        <h1 className="min-w-0 text-title font-bold text-text sm:text-headline">Navegador del paciente</h1>
      </div>
      <p className="mt-2 text-body text-text-muted">
        Te orientamos con palabras sencillas. No es un diagnóstico ni una receta.
      </p>
    </header>
  );
}
