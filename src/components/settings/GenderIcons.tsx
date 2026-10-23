import type { SVGProps } from "react";

// Two figures in the page's own style: solid, soft rounded shapes that take the text color,
// so they read on both themes and match the weight of the other icons.
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  width: 36,
  height: 36,
  fill: "currentColor",
  "aria-hidden": true,
  focusable: "false",
};

/** A standing figure with shoulders, arms and two legs. */
export function MaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.6" r="2.7" />
      {/* Shoulders and torso. */}
      <rect x="5.2" y="8.6" width="13.6" height="5.4" rx="2.7" />
      <rect x="8.3" y="10.4" width="7.4" height="6.4" rx="1.1" />
      {/* Arms hang free of the torso. */}
      <rect x="5.2" y="10.2" width="2.5" height="6.6" rx="1.25" />
      <rect x="16.3" y="10.2" width="2.5" height="6.6" rx="1.25" />
      {/* Legs. */}
      <rect x="8.5" y="14" width="3.1" height="8" rx="1.55" />
      <rect x="12.4" y="14" width="3.1" height="8" rx="1.55" />
    </svg>
  );
}

/** A standing figure in a dress, with two legs. */
export function FemaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.6" r="2.7" />
      {/* The dress: narrow at the shoulders, wide at the hem. The stroke rounds the corners. */}
      <path
        d="M9.6 8.9h4.8c.5 0 .9.3 1.1.8l2.6 7.1c.2.6-.2 1.2-.8 1.2H6.7c-.6 0-1-.6-.8-1.2l2.6-7.1c.2-.5.6-.8 1.1-.8Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect x="9.6" y="17.2" width="1.9" height="4.8" rx="0.95" />
      <rect x="12.5" y="17.2" width="1.9" height="4.8" rx="0.95" />
    </svg>
  );
}
