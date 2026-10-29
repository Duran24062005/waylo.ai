import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Hero } from "@/components/home/Hero";
import { HeroDecor } from "@/components/home/HeroDecor";
import { HomeAbout } from "@/components/home/HomeAbout";
import { ThemeToggle } from "@/components/theme";
import { buttonPrimary } from "@/components/ui/buttons";
import { getMessages } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import { homeStructuredData, toJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  // The home page is the site's own name, so it skips the "| Waylo.ai" suffix.
  // The canonical link is written in the page itself: Next drops the trailing slash of the home address, and crawlers expect it.
  return { title: { absolute: t.meta.siteTitle }, alternates: { canonical: null } };
}

// One column for the whole page: logo, title and text share the same left edge.
const column = "mx-auto w-full max-w-7xl px-4 sm:px-8";

export default async function HomePage() {
  const { locale, t } = await getMessages();
  // The chat is open to everyone: visitors without an account get a few free replies there.
  const chatHref = "/chat";

  return (
    <div className="bg-surface text-text">
      <link rel="canonical" href={`${SITE_URL}/`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(homeStructuredData({ description: t.meta.siteDescription, language: locale })),
        }}
      />
      <section className="relative isolate flex min-h-dvh flex-col lg:h-dvh">
        <HeroDecor />
        <header className={cn(column, "relative z-10 flex shrink-0 items-center justify-between gap-4 py-5")}>
          {/* The script W's ink starts right of its box; this margin (beyond the utility's own) lines it up with the column. */}
          <span className="font-script text-4xl text-title-gradient" style={{ marginLeft: "-0.31em" }}>
            Waylo
          </span>
          <div className="flex items-center gap-3">
            <Link href={chatHref} className={cn(buttonPrimary, "group h-12 gap-2 px-5 text-base")}>
              {t.home.goToChat}
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

      <HomeAbout t={t} />
    </div>
  );
}
