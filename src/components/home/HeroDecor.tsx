import { HugeiconsIcon } from "@hugeicons/react";
import { CardiogramIcon, PlusSignIcon } from "@hugeicons/core-free-icons";

/** Soft floating paper card with a couple of text lines. Decorative only. */
function PaperCard({ icon, className }: { icon: typeof CardiogramIcon; className: string }) {
  return (
    <div className={`absolute w-52 rounded-2xl bg-surface-raised/70 p-5 shadow-raised ${className}`}>
      <HugeiconsIcon icon={icon} size={40} strokeWidth={1.75} className="text-text/25" />
      <div className="mt-4 flex flex-col gap-2.5">
        <span className="h-2.5 w-4/5 rounded-full bg-text/10" />
        <span className="h-2.5 w-3/5 rounded-full bg-text/10" />
        <span className="h-2.5 w-2/3 rounded-full bg-text/[0.07]" />
      </div>
    </div>
  );
}

// Leaf drawn pointing right from its base at (0, 0): a long, slightly asymmetric blade.
const LEAF = "M0 0 C 26 -40, 104 -44, 160 0 C 106 34, 30 36, 0 0 Z";
const MIDRIB = "M6 0 Q 80 -4 154 0";

type LeafSpec = readonly [x: number, y: number, angle: number, scale: number, opacity?: number];

// Back layer: a few big leaves, softer and more out of focus.
const BACK: LeafSpec[] = [
  [6, 560, -62, 1.55, 0.75],
  [60, 560, -24, 1.45, 0.7],
  [0, 470, -78, 1.25, 0.65],
];

// Front layer: leaves fanning up and to the right along the stem.
const FRONT: LeafSpec[] = [
  [20, 552, -40, 1.35],
  [32, 520, -86, 1.1, 0.9],
  [56, 498, -14, 1.25],
  [72, 452, -60, 1.15, 0.95],
  [96, 420, -24, 1.1],
  [112, 382, -82, 1, 0.9],
  [132, 350, -36, 1],
  [152, 302, -64, 0.9, 0.95],
  [172, 282, -16, 0.85],
];

function Leaves({ specs, gradient }: { specs: LeafSpec[]; gradient: string }) {
  return specs.map(([x, y, angle, scale, opacity = 1]) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      <path d={LEAF} fill={`url(#${gradient})`} />
      <path d={MIDRIB} fill="none" stroke="var(--leaf-b)" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ));
}

/** An out-of-focus plant in the corner, like a foreground leaf in a product photo. */
function Plant() {
  return (
    <div className="absolute -bottom-10 -left-20 hidden h-[72%] w-[32rem] lg:block">
      <svg viewBox="0 0 400 560" preserveAspectRatio="xMinYMax meet" className="absolute inset-0 h-full w-full blur-[9px]">
        <defs>
          <linearGradient id="leaf-shade-back" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0" stopColor="var(--leaf-a)" />
            <stop offset="1" stopColor="var(--leaf-b)" />
          </linearGradient>
        </defs>
        <Leaves specs={BACK} gradient="leaf-shade-back" />
      </svg>
      <svg viewBox="0 0 400 560" preserveAspectRatio="xMinYMax meet" className="absolute inset-0 h-full w-full blur-[3.5px]">
        <defs>
          <linearGradient id="leaf-shade-front" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0" stopColor="var(--leaf-a)" />
            <stop offset="0.7" stopColor="var(--leaf-b)" />
            <stop offset="1" stopColor="var(--leaf-a)" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path d="M0 560 Q 92 420 178 272" fill="none" stroke="var(--leaf-a)" strokeWidth="5" strokeLinecap="round" />
        <Leaves specs={FRONT} gradient="leaf-shade-front" />
      </svg>
    </div>
  );
}

/**
 * Background of the first screen: blurred leaves bottom-left, waves along the bottom and two
 * paper cards drifting at the edges. All grays, behind the content, and still under reduced motion.
 */
export function HeroDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Waves */}
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[38%] w-full text-text">
        <path
          d="M0 120 C 240 40 420 210 720 170 C 1000 130 1180 20 1440 70 L1440 320 L0 320 Z"
          fill="currentColor"
          fillOpacity="0.04"
        />
        <path
          d="M0 220 C 300 140 520 300 820 250 C 1080 205 1260 150 1440 190 L1440 320 L0 320 Z"
          fill="currentColor"
          fillOpacity="0.05"
        />
      </svg>

      <Plant />

      {/* Paper cards drifting at the edges */}
      <PaperCard
        icon={CardiogramIcon}
        className="float-slow -left-16 top-[16%] hidden -rotate-[10deg] opacity-80 [--r:-10deg] xl:block motion-reduce:[animation:none]"
      />
      <PaperCard
        icon={PlusSignIcon}
        className="float-slow -right-12 bottom-[8%] hidden rotate-[12deg] opacity-70 [--r:12deg] [animation-delay:-3s] xl:block motion-reduce:[animation:none]"
      />
    </div>
  );
}
