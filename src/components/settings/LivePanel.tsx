"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { VOICES, type Voice } from "@/lib/preferences";
import { ChoiceCards, type ChoiceOption } from "./ChoiceCards";
import { VoiceAvatar } from "./LiveVisuals";
import { Setting, SettingsCard } from "./SettingsCard";
import { useSaveStatus } from "./useSaveStatus";
import { VoicePlayer } from "./VoicePlayer";

/** Waylo's voice. The language it speaks is the one chosen in General. */
export function LivePanel({ voice: initialVoice }: { voice: Voice }) {
  const { t } = useI18n();
  const copy = t.settings.live;
  const [voice, setVoice] = useState(initialVoice);
  const { status, track } = useSaveStatus();

  async function chooseVoice(next: Voice) {
    setVoice(next);
    await track(async () => {
      const response = await fetch("/api/preferencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voz: next }),
      });
      return response.ok;
    });
  }

  const voiceOptions: ChoiceOption<Voice>[] = VOICES.map((value) => ({
    value,
    label: copy.voiceOptions[value],
    hint: copy.voiceHints[value],
    visual: <VoiceAvatar voice={value} />,
  }));

  return (
    <SettingsCard title={copy.title} status={status}>
      <Setting label={copy.voiceLabel}>
        <ChoiceCards<Voice> label={copy.voiceLabel} value={voice} options={voiceOptions} onChange={(next) => void chooseVoice(next)} />
      </Setting>

      <Setting label={copy.preview}>
        <VoicePlayer voice={voice} />
      </Setting>
    </SettingsCard>
  );
}
