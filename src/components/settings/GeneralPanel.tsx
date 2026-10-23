"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES, LOCALE_CODES, LOCALE_NAMES, type Locale } from "@/i18n/locales";
import { SegmentedControl } from "./SegmentedControl";
import { Setting, SettingsCard } from "./SettingsCard";

export function GeneralPanel() {
  const { t, locale, setLocale } = useI18n();
  const options = LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value], caption: LOCALE_CODES[value] }));

  return (
    <SettingsCard title={t.settings.general.title}>
      <Setting label={t.settings.general.languageLabel} hint={t.settings.general.languageHint}>
        <SegmentedControl<Locale>
          label={t.settings.general.languageLabel}
          value={locale}
          options={options}
          onChange={(next) => void setLocale(next)}
        />
      </Setting>
    </SettingsCard>
  );
}
