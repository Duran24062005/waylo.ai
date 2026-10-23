import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isSection } from "@/components/settings/sections";
import { SettingsApp } from "@/components/settings/SettingsApp";
import { getMessages } from "@/i18n/server";
import { readPreferences } from "@/lib/preferences";
import { getProfile, listSessions } from "@/lib/profile-db";
import { getSession } from "@/lib/session";
import { readUsage, usageStatus } from "@/lib/usage";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return { title: t.meta.titles.settings };
}

export default async function ConfiguracionPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [{ s }, { locale }, session, jar] = await Promise.all([searchParams, getMessages(), getSession(), cookies()]);
  const preferences = readPreferences((name) => jar.get(name)?.value, locale);

  // Anyone can change the language, the look and the voice. The account, its sessions and its usage need an account.
  let profile = null;
  let sessions: Awaited<ReturnType<typeof listSessions>> = [];
  let usage = null;
  if (session) {
    try {
      [profile, sessions, usage] = await Promise.all([
        getProfile(session.id),
        listSessions(session.id, session.sid),
        readUsage(session.id).then((row) => usageStatus(row, Date.now())),
      ]);
    } catch {
      // The page still opens with what does not need the database; the account section asks the person to sign in again.
    }
  }

  return (
    <SettingsApp
      initialSection={isSection(s) ? s : "general"}
      profile={profile}
      sessions={sessions}
      usage={usage}
      voice={preferences.voz}
      liveLanguage={preferences.idiomaLive}
    />
  );
}
