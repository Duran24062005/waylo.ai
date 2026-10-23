import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return { title: t.meta.titles.privacy };
}

export default async function PrivacidadPage() {
  const { t } = await getMessages();
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-16 text-text">
      <Link href="/login" className="link-anim w-fit font-heading font-semibold">
        {t.common.back}
      </Link>
      <h1 className="font-script text-5xl text-title-gradient">{t.legal.privacyTitle}</h1>
      <p className="text-body-lg text-text-muted">{t.legal.privacyIntro}</p>
      <ul className="list-disc space-y-2 pl-6 text-body text-text">
        {t.legal.privacyItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="text-body text-text-muted">{t.legal.privacyOutro}</p>
    </main>
  );
}
