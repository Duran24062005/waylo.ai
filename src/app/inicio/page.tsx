import type { Metadata } from "next";
import { UserMenu } from "@/components/auth/UserMenu";
import { Hero } from "@/components/home/Hero";
import { Levels } from "@/components/home/Levels";
import { SocialDock } from "@/components/home/SocialDock";
import { ThemeToggle } from "@/components/theme";
import { socialLinks } from "@/data/social-links";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Inicio | Navegador del paciente",
};

export default async function InicioPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-text">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <span className="font-script text-4xl text-title-gradient">Waylo</span>
        <div className="flex flex-wrap items-center gap-4">
          <UserMenu nombre={session?.nombre} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-24 px-4 py-10 sm:px-8 lg:py-16">
        <Hero loggedIn={Boolean(session)} />
        <Levels />
      </main>

      {socialLinks.length > 0 ? (
        <footer className="flex justify-center px-4 pb-10 pt-12 sm:px-8">
          <SocialDock />
        </footer>
      ) : (
        <footer className="px-4 pb-10 pt-12 text-center text-caption text-text-muted sm:px-8">
          Waylo orienta. No diagnostica ni receta.
        </footer>
      )}
    </div>
  );
}
