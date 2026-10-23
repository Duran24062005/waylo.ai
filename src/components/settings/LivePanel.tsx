"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, type Locale } from "@/i18n/locales";
import { LIVE_LANGUAGES, VOICES, type LiveLanguage, type Voice } from "@/lib/preferences";
import { ChoiceCards, type ChoiceOption } from "./ChoiceCards";
import { AutoLanguageIcon, LanguageFlag, VoiceAvatar } from "./LiveVisuals";
import { Setting, SettingsCard } from "./SettingsCard";
import { useSaveStatus } from "./useSaveStatus";
import { VoicePlayer } from "./VoicePlayer";

interface LivePanelProps {
  voice: Voice;
  language: LiveLanguage;
}

export function LivePanel({ voice: initialVoice, language: initialLanguage }: LivePanelProps) {
  const { t } = useI18n();
  const copy = t.settings.live;
  const [voice, setVoice] = useState(initialVoice);
  const [language, setLanguage] = useState(initialLanguage);
  const { status, track } = useSaveStatus();

  async function save(patch: { voz?: Voice; idiomaLive?: LiveLanguage }) {
    await track(async () => {
      const response = await fetch("/api/preferencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      return response.ok;
    });
  }

  function chooseVoice(next: Voice) {
    setVoice(next);
    void save({ voz: next });
  }

  function chooseLanguage(next: LiveLanguage) {
    setLanguage(next);
    void save({ idiomaLive: next });
  }

  const voiceOptions: ChoiceOption<Voice>[] = VOICES.map((value) => ({
    value,
    label: copy.voiceOptions[value],
    hint: copy.voiceHints[value],
    visual: <VoiceAvatar voice={value} />,
  }));

  const languageOptions: ChoiceOption<LiveLanguage>[] = LIVE_LANGUAGES.map((value) => ({
    value,
    label: value === "auto" ? copy.auto : LOCALE_NAMES[value as Locale],
    visual: value === "auto" ? <AutoLanguageIcon /> : <LanguageFlag locale={value as Locale} />,
  }));

  return (
    <SettingsCard title={copy.title} status={status}>
      <Setting label={copy.voiceLabel}>
        <ChoiceCards<Voice> label={copy.voiceLabel} value={voice} options={voiceOptions} onChange={chooseVoice} />
      </Setting>

      <Setting label={copy.preview}>
        <VoicePlayer voice={voice} />
      </Setting>

      <Setting label={copy.languageLabel} hint={copy.languageHint}>
        <ChoiceCards<LiveLanguage>
          label={copy.languageLabel}
          value={language}
          options={languageOptions}
          onChange={chooseLanguage}
        />
      </Setting>
    </SettingsCard>
  );
}
