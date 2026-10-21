import type { Metadata } from "next";
import { UserMenu } from "@/components/auth/UserMenu";
import { Hero } from "@/components/home/Hero";
import { Levels } from "@/components/home/Levels";
import { SocialDock } from "@/components/home/SocialDock";
import { ThemeToggle } from "@/components/theme";
import { socialLinks } from "@/data/social-links";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Inicio",
};

export default async function InicioPage() {
  const session = await getSession();

  return (
    <div className="bg-surface text-text">
      <section className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="mx-auto flex w-full max-w-7xl shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <span className="font-script text-4xl text-title-gradient">Waylo</span>
        <nav aria-label="Secciones" className="hidden items-center gap-8 font-heading text-body font-medium md:flex">
          <a href="#niveles" className="link-anim rounded-sm decoration-transparent">
            Niveles
          </a>
          <a href="#como" className="link-anim rounded-sm decoration-transparent">
            Cómo funciona
          </a>
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          <UserMenu nombre={session?.nombre} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center px-4 pb-8 sm:px-8">
        <Hero loggedIn={Boolean(session)} />
      </main>
      </section>

      <div className="px-4 pb-4 pt-8 sm:px-8 lg:pt-16">
        <Levels />
      </div>

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
