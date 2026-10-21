# Design system contract

Stable contract for the chat, home, auth and mascot work. Extend it; do not rename it.

## Who owns what

| File | Owns |
| --- | --- |
| `src/app/globals.css` | All CSS tokens (color, type, spacing, radii, shadows, motion), light/dark values, Tailwind mapping, theme fade |
| `src/design/motion.ts` | The same motion values for JS (GSAP, motion) and `prefersReducedMotion()` |
| `src/components/theme/` | `ThemeProvider`, `useTheme`, `ThemeToggle`, `THEME_INIT_SCRIPT` |
| `src/components/mascot/contract.ts` | `MascotState`, `MascotProps` and what each state means |

## Color tokens

CSS variable -> Tailwind color (`bg-*`, `text-*`, `border-*`, `ring-*`, `outline-*`):

- `--surface` -> `surface` (page), `--surface-raised` -> `surface-raised` (cards, inputs)
- `--border` -> `border` (decorative dividers only), `--border-strong` -> `border-strong` (form controls, >= 3:1)
- `--text` -> `text`, `--text-muted` -> `text-muted` (e.g. `text-text-muted`)
- `--accent` / `--accent-foreground`, `--success` / `--success-foreground`,
  `--warning` / `--warning-foreground`, `--danger` / `--danger-foreground`
- `--focus-ring` -> `focus-ring`

`--danger` is the Urgencias red. Do not lighten it or swap it for a softer tone.
Every text token is >= 4.5:1 on both surfaces in both themes; each `*-foreground` is >= 4.5:1 on its fill.

shadcn aliases (for registry components): `--background`, `--foreground`, `--card`, `--card-foreground`,
`--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`,
`--destructive`. They point at the semantic tokens; never give them their own values.

## Type, spacing, shape

- Text: `text-caption` 16px (metadata only), `text-body` 18px (minimum for reading), `text-body-lg` 20px,
  `text-title` 24px, `text-headline` 30px, `text-display` 40px. Each sets line height and tracking.
- Spacing: 4px base; lay out in 8pt steps (`2`, `4`, `6`, `8`, `12`, `16` -> 8 to 64px).
- Radii: `rounded-sm` 12px, `rounded-md` 16px, `rounded-lg` 20px, `rounded-xl` 28px.
- Shadows: `shadow-soft` (resting cards), `shadow-raised` (popovers, focused panels). Both adapt to dark mode.
- Touch targets: at least 44px (`min-h-11 min-w-11`).

## Motion

`--duration-fast` 150ms, `--duration-base` 250ms, `--duration-slow` 400ms,
`--ease-standard` (`ease-standard`), `--ease-emphasis` (`ease-emphasis`, success moment only).
In CSS: `duration-[var(--duration-base)] ease-standard`. In JS: `duration.base`, `easing.standard`
from `@/design/motion`. Under `prefers-reduced-motion: reduce` the CSS durations become 0ms; JS code
must check `prefersReducedMotion()` and skip or shorten animations.

## Theme

`ThemeProvider` wraps the app in `src/app/layout.tsx`, and `THEME_INIT_SCRIPT` runs in `<head>` so
there is no flash. Preference is `"light" | "dark" | "system"` (default `"system"`), stored in
`localStorage` under `waylo-theme`. `"system"` removes `data-theme` and the media query decides.

```tsx
import { ThemeToggle, useTheme } from "@/components/theme";

const { preference, resolvedTheme, setPreference } = useTheme();
<ThemeToggle /> // place it where the page header needs it
```

Theme changes cross-fade with a view transition (opacity fallback), instant under reduced motion.

## Rules for new code

- Use semantic tokens (`bg-surface`, `text-text-muted`, `border-border-strong`, `bg-danger`).
  Do not add `slate-*`, `blue-*` or raw hex colors. Existing chat classes stay until their owner migrates them.
- Never encode meaning by color alone: pair `danger`/`warning`/`success` with text.
- All user-visible copy is Spanish and simple; follow AGENTS.md.
