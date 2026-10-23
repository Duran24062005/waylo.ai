"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { buttonSoft } from "@/components/ui/buttons";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES } from "@/i18n/locales";
import { LIVE_LANGUAGES, VOICES, type LiveLanguage, type Voice } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "./SegmentedControl";
import { Setting, SettingsCard } from "./SettingsCard";
import { useSaveStatus } from "./useSaveStatus";

interface LivePanelProps {
  voice: Voice;
  language: LiveLanguage;
}

export function LivePanel({ voice: initialVoice, language: initialLanguage }: LivePanelProps) {
  const { t, locale } = useI18n();
  const copy = t.settings.live;
  const [voice, setVoice] = useState(initialVoice);
  const [language, setLanguage] = useState(initialLanguage);
  const [previewing, setPreviewing] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const { status, track } = useSaveStatus();
  const audio = useRef<HTMLAudioElement | null>(null);

  // Leaving the page cuts the sample short.
  useEffect(() => () => audio.current?.pause(), []);

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

  /** Plays a short sentence with the chosen voice, so it can be judged before talking. */
  async function preview() {
    if (previewing) return;
    setPreviewing(true);
    setPreviewFailed(false);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: copy.previewText, voice, lang: locale }),
      });
      if (!response.ok) throw new Error("preview failed");
      const url = URL.createObjectURL(await response.blob());
      audio.current?.pause();
      const player = new Audio(url);
      audio.current = player;
      const done = () => {
        URL.revokeObjectURL(url);
        setPreviewing(false);
      };
      player.onended = done;
      player.onerror = done;
      await player.play().catch(done);
    } catch {
      setPreviewFailed(true);
      setPreviewing(false);
    }
  }

  const languageNames: Record<LiveLanguage, string> = {
    auto: copy.auto,
    es: LOCALE_NAMES.es,
    en: LOCALE_NAMES.en,
    pt: LOCALE_NAMES.pt,
  };

  return (
    <SettingsCard title={copy.title} status={status}>
      <Setting label={copy.voiceLabel}>
        <SegmentedControl<Voice>
          label={copy.voiceLabel}
          value={voice}
          onChange={chooseVoice}
          columns={2}
          options={VOICES.map((value) => ({ value, label: copy.voiceOptions[value] }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void preview()}
            disabled={previewing}
            className={cn(buttonSoft, "min-h-11 px-4 text-sm")}
          >
            <HugeiconsIcon icon={previewing ? VolumeHighIcon : PlayIcon} size={18} strokeWidth={2.25} aria-hidden />
            {previewing ? copy.previewing : copy.preview}
          </button>
          {previewFailed ? (
            <p role="alert" className="text-sm font-semibold text-danger">
              {copy.previewFailed}
            </p>
          ) : null}
        </div>
      </Setting>

      <Setting label={copy.languageLabel} hint={copy.languageHint}>
        <SegmentedControl<LiveLanguage>
          label={copy.languageLabel}
          value={language}
          onChange={chooseLanguage}
          columns={4}
          options={LIVE_LANGUAGES.map((value) => ({ value, label: languageNames[value] }))}
        />
      </Setting>
    </SettingsCard>
  );
}
