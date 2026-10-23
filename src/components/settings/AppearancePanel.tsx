"use client";

import { useTheme } from "@/components/theme";
import { useT } from "@/i18n/I18nProvider";
import { Setting, SettingsCard } from "./SettingsCard";
import { ThemeCards } from "./ThemeCards";

export function AppearancePanel() {
  const t = useT().settings.appearance;
  const { preference, setPreference } = useTheme();

  return (
    <SettingsCard title={t.title}>
      <Setting label={t.modeLabel} hint={t.modeHint}>
        <ThemeCards
          label={t.modeLabel}
          value={preference}
          onChange={setPreference}
          options={[
            { value: "light", label: t.light },
            { value: "dark", label: t.dark },
            { value: "system", label: t.system },
          ]}
        />
      </Setting>
    </SettingsCard>
  );
}
