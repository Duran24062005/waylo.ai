"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { LANGUAGE_CHOICES, LOCALE_NAMES, type LanguageChoice, type Locale } from "@/i18n/locales";
import { ChoiceCards, type ChoiceOption } from "./ChoiceCards";
import { AutoLanguageIcon, LanguageFlag } from "./LiveVisuals";
import { Setting, SettingsCard } from "./SettingsCard";

/** The language of the app, of Waylo's replies and of the voice: one setting for all of them. */
export function GeneralPanel() {
  const { t, choice, setLocale } = useI18n();
  const copy = t.settings.general;

  const options: ChoiceOption<LanguageChoice>[] = LANGUAGE_CHOICES.map((value) => ({
    value,
    label: value === "auto" ? copy.auto : LOCALE_NAMES[value as Locale],
    visual: value === "auto" ? <AutoLanguageIcon /> : <LanguageFlag locale={value as Locale} />,
  }));

  return (
    <SettingsCard title={copy.title}>
      <Setting label={copy.languageLabel} hint={copy.languageHint}>
        <ChoiceCards<LanguageChoice>
          label={copy.languageLabel}
          value={choice}
          options={options}
          onChange={(next) => void setLocale(next)}
        />
      </Setting>
    </SettingsCard>
  );
}
