import { useId } from "react";

/** Static, light version of the mascot for message avatars. No animation, no GSAP. */
export function MascotMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-b`} cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.38" stopColor="#f4f5f8" />
          <stop offset="0.78" stopColor="#d3d7de" />
          <stop offset="1" stopColor="#a9afbb" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill={`url(#${id}-b)`} />
      <g transform="translate(47 56) rotate(-16)">
        <rect x="-4.5" y="-11" width="9" height="22" rx="4.5" fill="#0d0e12" />
      </g>
      <g transform="translate(73 56) rotate(-16)">
        <rect x="-4.5" y="-11" width="9" height="22" rx="4.5" fill="#0d0e12" />
      </g>
    </svg>
  );
}
