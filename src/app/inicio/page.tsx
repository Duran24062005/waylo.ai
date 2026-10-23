import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Hero } from "@/components/home/Hero";
import { HeroDecor } from "@/components/home/HeroDecor";
import { Levels } from "@/components/home/Levels";
import { SocialDock } from "@/components/home/SocialDock";
import { ThemeToggle } from "@/components/theme";
import { buttonPrimary } from "@/components/ui/buttons";
import { socialLinks } from "@/data/social-links";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio",
};

// One column for the whole page: logo, title, text and sections share the same left edge.
const column = "mx-auto w-full max-w-7xl px-4 sm:px-8";

export default function InicioPage() {
  // The chat is open to everyone: visitors without an account get a few free replies there.
  const chatHref = "/chat";

  return (
    <div className="bg-surface text-text">
      <section className="relative isolate flex min-h-dvh flex-col lg:h-dvh">
        <HeroDecor />
        <header className={cn(column, "relative z-10 flex shrink-0 items-center justify-between gap-4 py-5")}>
          {/* The script W's ink starts right of its box; this margin (beyond the utility's own) lines it up with the column. */}
          <span className="font-script text-4xl text-title-gradient" style={{ marginLeft: "-0.31em" }}>
            Waylo
          </span>
          <div className="flex items-center gap-3">
            <Link href={chatHref} className={cn(buttonPrimary, "group h-12 gap-2 px-5 text-base")}>
              Ir al Chat
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                size={18}
                strokeWidth={2.25}
                aria-hidden
                className="transition-transform duration-[var(--duration-base)] ease-standard group-hover:translate-x-0.5"
              />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className={cn(column, "relative z-10 flex min-h-0 flex-1 items-center pb-8")}>
          <Hero chatHref={chatHref} />
        </main>
      </section>

      <div className={cn(column, "pb-4 pt-8 lg:pt-16")}>
        <Levels />
      </div>

      {socialLinks.length > 0 ? (
        <footer className={cn(column, "flex justify-center pb-10 pt-12")}>
          <SocialDock />
        </footer>
      ) : (
        <footer className={cn(column, "pb-10 pt-12 text-center text-caption text-text-muted")}>
          Waylo orienta. No diagnostica ni receta.
        </footer>
      )}
    </div>
  );
}
