import { useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import type { Locale } from "@/i18n/locales";
import type { Voice } from "@/lib/preferences";

// Drawn here, in the page's own palette: black and white that follow the theme, so a voice reads on both.

/** The disc every visual sits in. It stays light on the dark chosen card and dark on the light one, through the theme. */
const DISC = "grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-surface shadow-inset text-text";

/** A bust of a woman: long hair, a face, shoulders. */
function FemaleAvatar() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden focusable="false" fill="currentColor">
      {/* Hair behind the head, down to the shoulders. */}
      <path d="M19.5 31c0-10 5.6-16.5 12.5-16.5S44.5 21 44.5 31v15h-25V31Z" />
      {/* Shoulders and neck. */}
      <path d="M10 66c0-11 9.5-17 22-17s22 6 22 17H10Z" opacity="0.5" />
      <rect x="28.2" y="38" width="7.6" height="12" rx="3.4" opacity="0.28" />
      {/* Face, with the fringe over it. */}
      <ellipse cx="32" cy="29.5" rx="8.6" ry="9.8" opacity="0.18" />
      <path d="M22.8 28.5c0-7 4-11.8 9.2-11.8s9.2 4.8 9.2 11.8c-3.4-1.6-7.2-4-9.2-7.4-2 3.4-5.8 5.8-9.2 7.4Z" />
    </svg>
  );
}

/** A bust of a man: short hair, a face, shoulders. */
function MaleAvatar() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden focusable="false" fill="currentColor">
      <path d="M8 66c0-12 10-17.5 24-17.5S56 54 56 66H8Z" opacity="0.5" />
      <rect x="27.6" y="38" width="8.8" height="12" rx="3.6" opacity="0.28" />
      <ellipse cx="32" cy="29" rx="9.4" ry="10.6" opacity="0.18" />
      {/* Short hair, swept a little to one side. */}
      <path d="M21.8 27.6c-.8-8.6 4.2-14.4 11.2-14 6.4.4 10.2 5.4 9.2 14-1.6-3.4-4.4-5.6-8.2-6.2-4.8 1.6-9.4 2.2-12.2 6.2Z" />
    </svg>
  );
}

export function VoiceAvatar({ voice }: { voice: Voice }) {
  return <span className={DISC}>{voice === "femenino" ? <FemaleAvatar /> : <MaleAvatar />}</span>;
}

/** The round flag of a language. Simplified drawings: the colors and the main shapes are what is recognized. */
function Flag({ locale }: { locale: Locale }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {locale === "es" ? (
          <>
            <rect width="32" height="32" fill="#c60b1e" />
            <rect y="8" width="32" height="16" fill="#ffc400" />
          </>
        ) : null}
        {locale === "en" ? (
          <>
            <rect width="32" height="32" fill="#012169" />
            <path d="M0 0 32 32M32 0 0 32" stroke="#fff" strokeWidth="6" />
            <path d="M0 0 32 32M32 0 0 32" stroke="#c8102e" strokeWidth="2" />
            <path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="10" />
            <path d="M16 0v32M0 16h32" stroke="#c8102e" strokeWidth="6" />
          </>
        ) : null}
        {locale === "pt" ? (
          <>
            <rect width="32" height="32" fill="#009b3a" />
            <path d="M16 4.5 29 16 16 27.5 3 16Z" fill="#fedf00" />
            <circle cx="16" cy="16" r="6.4" fill="#002776" />
            <path d="M10.2 14.4c4-1.2 8.6-.4 11.6 2.2" stroke="#fff" strokeWidth="1.2" fill="none" />
          </>
        ) : null}
      </g>
      {/* A hairline ring, so a white edge does not melt into the card. */}
      <circle cx="16" cy="16" r="15.6" fill="none" stroke="currentColor" strokeOpacity="0.16" />
    </svg>
  );
}

export function LanguageFlag({ locale }: { locale: Locale }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-text">
      <Flag locale={locale} />
    </span>
  );
}

/** Automatic detection: a globe, since no single country is the language. */
export function AutoLanguageIcon() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-text shadow-inset">
      <HugeiconsIcon icon={Globe02Icon} size={20} strokeWidth={2.25} aria-hidden />
    </span>
  );
}
