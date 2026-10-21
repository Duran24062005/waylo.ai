import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { duration, gsapEasePath } from "@/design/motion";
import type { MascotState } from "./contract";
import { BLINKS, POSES, type Pose } from "./states";

export interface MascotTargets {
  body: SVGGElement;
  shadow: SVGElement;
  /** Both eyes together: the blink squashes this group. */
  lids: SVGGElement;
  /** Both eyes as a pair, for glances. */
  look: SVGGElement;
  /** Each eye, for state shapes such as wider or narrower. */
  eyes: SVGGElement[];
}

const STANDARD = "waylo-standard";
const EMPHASIS = "waylo-emphasis";

let easesReady = false;

function ensureEases() {
  if (easesReady) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(STANDARD, gsapEasePath.standard);
  CustomEase.create(EMPHASIS, gsapEasePath.emphasis);
  easesReady = true;
}

/** Fixes every transform origin to the center of what it moves. Call once before animating. */
export function initOrigins(t: MascotTargets) {
  gsap.set(t.body, { svgOrigin: "60 58" });
  gsap.set(t.shadow, { svgOrigin: "60 108" });
  gsap.set([t.lids, t.look, ...t.eyes], { transformOrigin: "50% 50%" });
}

/** Sets every animated value of the character to a state's resting pose, with no motion. */
export function applyPose(t: MascotTargets, state: MascotState) {
  const pose = POSES[state];
  gsap.set(t.body, { scale: pose.bodyScale, rotation: pose.bodyRotation, y: 0 });
  gsap.set(t.shadow, { scaleX: 1, opacity: 1 });
  gsap.set(t.lids, { scaleY: 1 });
  gsap.set(t.look, { x: pose.lookX });
  gsap.set(t.eyes, { scaleX: pose.eyeScaleX, scaleY: pose.eyeScaleY });
}

function settleTo(tl: gsap.core.Timeline, t: MascotTargets, pose: Pose, seconds: number) {
  const ease = STANDARD;
  tl.to(t.body, { scale: pose.bodyScale, rotation: pose.bodyRotation, y: 0, duration: seconds, ease }, 0)
    .to(t.shadow, { scaleX: 1, opacity: 1, duration: seconds, ease }, 0)
    .to(t.lids, { scaleY: 1, duration: seconds, ease }, 0)
    .to(t.look, { x: pose.lookX, duration: seconds, ease }, 0)
    .to(t.eyes, { scaleX: pose.eyeScaleX, scaleY: pose.eyeScaleY, duration: seconds, ease }, 0);
}

function startBlinking(t: MascotTargets): () => void {
  const blink = gsap.timeline({ paused: true });
  blink.to(t.lids, { scaleY: 0.1, duration: 0.09, ease: "power1.inOut", yoyo: true, repeat: 1 });
  let wait: gsap.core.Tween | undefined;
  const schedule = () => {
    wait = gsap.delayedCall(gsap.utils.random(3, 5), () => {
      blink.restart();
    });
  };
  blink.eventCallback("onComplete", schedule);
  schedule();
  return () => {
    wait?.kill();
    blink.kill();
  };
}

/**
 * Builds one timeline for the state. Returns a cleanup that stops it and any blink timer.
 * `instant` skips the move from the previous pose, used on first render.
 */
export function playState(t: MascotTargets, state: MascotState, instant: boolean): () => void {
  ensureEases();
  const pose = POSES[state];
  const settle = instant ? 0 : duration.base;

  const tl = gsap.timeline();
  settleTo(tl, t, pose, settle);

  switch (state) {
    case "idle":
      tl.to(t.body, { scale: 1.02, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      tl.to(t.shadow, { scaleX: 1.03, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      break;

    case "listening":
      break;

    case "thinking": {
      tl.to(t.body, { rotation: 2, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      const glance = gsap.timeline({ repeat: -1 });
      glance
        .to(t.look, { x: -4, duration: 1.6, ease: "sine.inOut" })
        .to(t.look, { x: -4, duration: 0.6 })
        .to(t.look, { x: 4, duration: 1.6, ease: "sine.inOut" })
        .to(t.look, { x: 4, duration: 0.6 });
      tl.add(glance, settle);
      break;
    }

    case "speaking": {
      const pulse = gsap.timeline({ repeat: -1 });
      pulse
        .to(t.eyes, { scaleY: 1.14, duration: 0.26, ease: "sine.inOut" })
        .to(t.eyes, { scaleY: 0.98, duration: 0.22, ease: "sine.inOut" })
        .to(t.eyes, { scaleY: 1.1, duration: 0.3, ease: "sine.inOut" })
        .to(t.eyes, { scaleY: pose.eyeScaleY, duration: 0.2, ease: "sine.inOut" });
      tl.add(pulse, settle);
      break;
    }

    case "alert":
      // One soft pulse on entry, then a steady pose.
      tl.to(t.body, { scale: 1.04, duration: 0.45, ease: STANDARD }, settle).to(t.body, {
        scale: 1,
        duration: 0.7,
        ease: STANDARD,
      });
      break;

    case "error":
      // One soft sway to each side, then a still, drooping pose.
      tl.to(t.body, { rotation: -8, duration: 0.5, ease: STANDARD }, settle)
        .to(t.body, { rotation: -3, duration: 0.6, ease: STANDARD })
        .to(t.body, { rotation: pose.bodyRotation, duration: 0.8, ease: STANDARD });
      break;

    case "success":
      tl.to(t.body, { scaleX: 1.04, scaleY: 0.94, duration: 0.1, ease: "power1.out" }, settle)
        .to(t.body, { y: -14, scaleX: 0.98, scaleY: 1.04, duration: 0.22, ease: "power2.out" })
        .to(t.shadow, { scaleX: 0.8, opacity: 0.6, duration: 0.22, ease: "power2.out" }, "<")
        .to(t.body, { y: 0, scaleX: 1, scaleY: 1, duration: 0.4, ease: EMPHASIS })
        .to(t.shadow, { scaleX: 1, opacity: 1, duration: 0.4, ease: EMPHASIS }, "<");
      break;
  }

  const stopBlinking = BLINKS[state] ? startBlinking(t) : undefined;

  return () => {
    stopBlinking?.();
    tl.kill();
  };
}
