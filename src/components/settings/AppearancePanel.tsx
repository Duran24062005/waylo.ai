"use client";

import { ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme, type ThemePreference } from "@/components/theme";
import { useT } from "@/i18n/I18nProvider";
import { SegmentedControl } from "./SegmentedControl";
import { Setting, SettingsCard } from "./SettingsCard";

export function AppearancePanel() {
  const t = useT().settings.appearance;
  const { preference, setPreference } = useTheme();

  return (
    <SettingsCard title={t.title}>
      <Setting label={t.modeLabel} hint={t.modeHint}>
        <SegmentedControl<ThemePreference>
          label={t.modeLabel}
          value={preference}
          onChange={setPreference}
          options={[
            { value: "light", label: t.light, icon: Sun01Icon },
            { value: "dark", label: t.dark, icon: Moon02Icon },
            { value: "system", label: t.system, icon: ComputerIcon },
          ]}
        />
      </Setting>
    </SettingsCard>
  );
}
