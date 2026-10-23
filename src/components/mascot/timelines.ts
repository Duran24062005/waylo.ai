import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { duration, gsapEasePath } from "@/design/motion";
import type { MascotState } from "./contract";
import { EYE_X, EYE_Y, orbitEye } from "./orbit";
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
  /** Each eye's place on the turning sphere (left, right). */
  orbits: SVGGElement[];
  /** The open eye shapes, which squash away when the eyes close. */
  opens: SVGGElement[];
  /** The closed-eye strokes, shown when the eyes shut. */
  shut: SVGElement[];
  /** Current turn in degrees. GSAP tweens it and the eyes follow. */
  turn: { value: number };
  /** The mute icon, where the mouth would be. */
  mute: SVGElement;
  /** The three Z of a resting mascot, smallest first. */
  zzz: SVGElement[];
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
  gsap.set([t.lids, t.look, ...t.eyes, ...t.opens, ...t.shut, t.mute, ...t.zzz], { transformOrigin: "50% 50%" });
  t.orbits.forEach((orbit, i) => gsap.set(orbit, { svgOrigin: `${EYE_X[i]} ${EYE_Y}` }));
}

function placeEyes(t: MascotTargets) {
  t.orbits.forEach((orbit, i) => {
    const { x, scaleX, opacity } = orbitEye(EYE_X[i], t.turn.value);
    gsap.set(orbit, { x, scaleX, opacity });
  });
}

function setClosed(t: MascotTargets, closed: number) {
  gsap.set(t.opens, { scaleY: 1 - 0.88 * closed, opacity: 1 - closed });
  gsap.set(t.shut, { scaleX: 0.6 + 0.4 * closed, opacity: closed });
}

/** Sets every animated value of the character to a state's resting pose, with no motion. */
export function applyPose(t: MascotTargets, state: MascotState) {
  const pose = POSES[state];
  gsap.set(t.body, { scale: pose.bodyScale, rotation: pose.bodyRotation, y: 0 });
  gsap.set(t.shadow, { scaleX: 1, opacity: 1 });
  gsap.set(t.lids, { scaleY: 1 });
  gsap.set(t.look, { x: pose.lookX });
  gsap.set(t.eyes, { scaleX: pose.eyeScaleX, scaleY: pose.eyeScaleY });
  t.turn.value = pose.turn;
  placeEyes(t);
  setClosed(t, pose.closed);
  gsap.set(t.mute, { opacity: pose.mute, scale: pose.mute ? 1 : 0.4, rotation: 0 });
  // Without motion, a resting mascot shows its Z standing still.
  gsap.set(t.zzz, { opacity: pose.zzz ? 0.85 : 0, x: 0, y: 0, scale: 1, rotation: 0 });
}

function settleTo(tl: gsap.core.Timeline, t: MascotTargets, pose: Pose, seconds: number) {
  const ease = STANDARD;
  tl.to(t.body, { scale: pose.bodyScale, rotation: pose.bodyRotation, y: 0, duration: seconds, ease }, 0)
    .to(t.shadow, { scaleX: 1, opacity: 1, duration: seconds, ease }, 0)
    .to(t.lids, { scaleY: 1, duration: seconds, ease }, 0)
    .to(t.look, { x: pose.lookX, duration: seconds, ease }, 0)
    .to(t.eyes, { scaleX: pose.eyeScaleX, scaleY: pose.eyeScaleY, duration: seconds, ease }, 0);

  // The mute icon pops in with a small bounce; it shrinks away with the standard ease.
  if (pose.mute) {
    tl.to(t.mute, { opacity: 1, scale: 1, rotation: 0, duration: seconds * 1.4, ease: "back.out(2.4)" }, seconds * 0.3);
  } else {
    tl.to(t.mute, { opacity: 0, scale: 0.4, duration: seconds, ease }, 0);
  }
  // The Z of a resting mascot are driven by their own loop, so they are only faded out when it wakes.
  if (!pose.zzz) tl.to(t.zzz, { opacity: 0, duration: seconds, ease }, 0);

  // Turning away: rotate first, then close the eyes. Turning back: open them first, then rotate.
  const turnTo = (at: number, length: number) =>
    tl.to(t.turn, { value: pose.turn, duration: length, ease, onUpdate: () => placeEyes(t) }, at);
  const shutTo = (at: number, length: number) =>
    tl
      .to(t.opens, { scaleY: 1 - 0.88 * pose.closed, opacity: 1 - pose.closed, duration: length, ease }, at)
      .to(t.shut, { scaleX: 0.6 + 0.4 * pose.closed, opacity: pose.closed, duration: length, ease }, at);

  if (seconds === 0) {
    turnTo(0, 0);
    shutTo(0, 0);
  } else if (pose.closed > 0) {
    turnTo(0, 0.8);
    shutTo(0.4, 0.22);
  } else {
    shutTo(0, 0.26);
    turnTo(0.12, 0.75);
  }
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

    case "muted": {
      tl.to(t.body, { scale: 1.015, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      // Every so often the icon gives a small shake, so the mute reads as alive, not stuck.
      const shake = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
      shake
        .to(t.mute, { rotation: -9, duration: 0.12, ease: "sine.inOut" })
        .to(t.mute, { rotation: 9, duration: 0.16, ease: "sine.inOut" })
        .to(t.mute, { rotation: 0, duration: 0.14, ease: "sine.inOut" });
      tl.add(shake, settle + 1);
      break;
    }

    case "resting": {
      // Slow breathing and a faint sway, as if dozing.
      tl.to(t.body, { scale: 1.03, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      tl.to(t.body, { rotation: 2.5, duration: 4.4, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      tl.to(t.shadow, { scaleX: 1.04, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 }, settle);
      // Each Z rises, grows and fades, a little after the one before it.
      t.zzz.forEach((z, i) => {
        const rise = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
        rise
          .fromTo(
            z,
            { opacity: 0, x: 0, y: 8, scale: 0.5, rotation: -12 },
            { opacity: 0.9, x: 5, y: -3, scale: 1, rotation: 6, duration: 1.2, ease: "sine.out" },
          )
          .to(z, { opacity: 0, x: 12, y: -16, scale: 1.2, rotation: 16, duration: 1.2, ease: "sine.in" });
        tl.add(rise, settle + i * 0.7);
      });
      break;
    }

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
