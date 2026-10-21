import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { SocialDock } from "@/components/home/SocialDock";
import { ThemeToggle } from "@/components/theme";
import { socialLinks } from "@/data/social-links";

export const metadata: Metadata = {
  title: "Inicio | Navegador del paciente",
};

export default function InicioPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-text">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <span className="text-title font-bold">Waylo</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center px-4 py-8 sm:px-6">
        <Hero />
      </main>

      {socialLinks.length > 0 ? (
        <footer className="flex justify-center px-4 pb-8 pt-4 sm:px-6">
          <SocialDock />
        </footer>
      ) : null}
    </div>
  );
}
