"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { createVad, splitForSpeech } from "@/lib/voice";

export type LivePhase = "off" | "waiting" | "listening" | "thinking" | "speaking" | "muted" | "error";

// With no speech yet, the recording restarts this often, so the start of a sentence is never cut
// and silence does not pile up.
const WINDOW_MS = 1500;
// Recordings smaller than this are noise, not a sentence.
const MIN_BLOB_BYTES = 3000;
const TICK_MS = 40;
const NOTICE_MS = 3500;

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

export function isVoiceSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof AudioContext !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

interface Engine {
  stream: MediaStream;
  ctx: AudioContext;
  mic: AnalyserNode;
  out: AnalyserNode;
  audio: HTMLAudioElement;
  mime: string | undefined;
  vad: ReturnType<typeof createVad>;
  timer: number;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  windowTimer: number | undefined;
  speechStarted: boolean;
  speakToken: number;
  endPlayback: (() => void) | null;
}

interface Options {
  /** Receives each sentence the patient says, already transcribed. */
  onUtterance: (text: string) => void;
  /** True while the chat is waiting for the AI's answer. Listening pauses meanwhile. */
  busy: boolean;
}

/** Loudness of an analyser, 0 to 1. */
function loudness(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
  return Math.min(1, Math.sqrt(sum / buffer.length) * 4);
}

export function useLiveVoice({ onUtterance, busy }: Options) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [heard, setHeard] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [talking, setTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** Loudness of whatever is being heard right now, mic or the assistant's voice. Read it per frame, no re-renders. */
  const levelRef: MutableRefObject<number> = useRef(0);
  const engineRef = useRef<Engine | null>(null);
  const onUtteranceRef = useRef(onUtterance);
  const noticeTimer = useRef<number | undefined>(undefined);
  // The loop runs outside React, so it reads the latest flags from here.
  const flags = useRef({ muted: false, busy: false, transcribing: false, talking: false });

  useEffect(() => {
    onUtteranceRef.current = onUtterance;
    flags.current = { muted, busy, transcribing, talking };
  });

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  const discardRecording = useCallback((engine: Engine) => {
    window.clearTimeout(engine.windowTimer);
    engine.windowTimer = undefined;
    const recorder = engine.recorder;
    engine.recorder = null;
    engine.chunks = [];
    engine.speechStarted = false;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // Already stopped.
      }
    }
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      flags.current.transcribing = true;
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append("audio", blob, `voz.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
        const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
        if (!response.ok) throw new Error("transcription failed");
        const { text } = (await response.json()) as { text?: string };
        if (text && text.trim().length > 1) onUtteranceRef.current(text.trim());
      } catch {
        showNotice("No te pude entender. Inténtalo de nuevo.");
      } finally {
        flags.current.transcribing = false;
        setTranscribing(false);
      }
    },
    [showNotice],
  );

  const startRecording = useCallback(
    (engine: Engine) => {
      if (engine.recorder) return;
      const recorder = new MediaRecorder(engine.stream, engine.mime ? { mimeType: engine.mime } : undefined);
      engine.chunks = [];
      engine.speechStarted = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) engine.chunks.push(event.data);
      };
      recorder.start();
      engine.recorder = recorder;
      engine.windowTimer = window.setTimeout(() => {
        if (engine.speechStarted) return;
        discardRecording(engine);
        startRecording(engine);
      }, WINDOW_MS);
    },
    [discardRecording],
  );

  const finishRecording = useCallback(
    (engine: Engine) => {
      const recorder = engine.recorder;
      if (!recorder) return;
      window.clearTimeout(engine.windowTimer);
      engine.recorder = null;
      recorder.onstop = () => {
        const blob = new Blob(engine.chunks, { type: recorder.mimeType || engine.mime || "audio/webm" });
        engine.chunks = [];
        engine.speechStarted = false;
        if (blob.size >= MIN_BLOB_BYTES) void transcribe(blob);
      };
      try {
        recorder.stop();
      } catch {
        engine.chunks = [];
      }
    },
    [transcribe],
  );

  const stopPlayback = useCallback((engine: Engine) => {
    engine.speakToken += 1;
    engine.endPlayback?.();
    engine.endPlayback = null;
    engine.audio.pause();
  }, []);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    engineRef.current = null;
    if (engine) {
      window.clearInterval(engine.timer);
      discardRecording(engine);
      stopPlayback(engine);
      engine.stream.getTracks().forEach((track) => track.stop());
      void engine.ctx.close().catch(() => {});
    }
    levelRef.current = 0;
    setActive(false);
    setMuted(false);
    setHeard(false);
    setTalking(false);
    setTranscribing(false);
    setNotice(null);
  }, [discardRecording, stopPlayback]);

  const start = useCallback(async () => {
    if (engineRef.current) return;
    setError(null);
    if (!isVoiceSupported()) {
      setError("Tu navegador no permite usar el micrófono.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (cause) {
      const denied = cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setError(denied ? "Permite el micrófono en tu navegador para usar la voz." : "No pude acceder al micrófono.");
      return;
    }

    const ctx = new AudioContext();
    await ctx.resume().catch(() => {});

    const mic = ctx.createAnalyser();
    mic.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(mic);

    const audio = new Audio();
    const out = ctx.createAnalyser();
    out.fftSize = 1024;
    const speaker = ctx.createMediaElementSource(audio);
    speaker.connect(out);
    out.connect(ctx.destination);

    const micBuffer = new Float32Array(mic.fftSize);
    const outBuffer = new Float32Array(out.fftSize);

    const engine: Engine = {
      stream,
      ctx,
      mic,
      out,
      audio,
      mime: MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)),
      vad: createVad({ minThreshold: 0.08 }),
      timer: 0,
      recorder: null,
      chunks: [],
      windowTimer: undefined,
      speechStarted: false,
      speakToken: 0,
      endPlayback: null,
    };
    engineRef.current = engine;

    let smoothed = 0;
    engine.timer = window.setInterval(() => {
      const { muted: isMuted, busy: isBusy, transcribing: isTranscribing, talking: isTalking } = flags.current;
      const micLevel = loudness(mic, micBuffer);
      const level = isTalking ? loudness(out, outBuffer) : isMuted ? 0 : micLevel;
      smoothed = smoothed * 0.6 + level * 0.4;
      levelRef.current = smoothed;

      const listening = !isMuted && !isBusy && !isTranscribing && !isTalking;
      if (!listening) {
        if (engine.recorder) discardRecording(engine);
        engine.vad.reset();
        setHeard(false);
        return;
      }

      if (!engine.recorder) startRecording(engine);

      const event = engine.vad.push(micLevel, performance.now());
      if (event === "start") {
        engine.speechStarted = true;
        window.clearTimeout(engine.windowTimer);
        setHeard(true);
      } else if (event === "end") {
        setHeard(false);
        finishRecording(engine);
      } else if (event === "cancel") {
        setHeard(false);
        discardRecording(engine);
      }
    }, TICK_MS);

    setActive(true);
    setMuted(false);
  }, [discardRecording, finishRecording, startRecording]);

  const toggleMute = useCallback(() => {
    const engine = engineRef.current;
    setMuted((current) => {
      const next = !current;
      // A muted mic is really off, not just ignored.
      engine?.stream.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, []);

  const speak = useCallback(
    (text: string) => {
      const engine = engineRef.current;
      if (!engine) return;
      const pieces = splitForSpeech(text);
      if (pieces.length === 0) return;

      stopPlayback(engine);
      const token = engine.speakToken;
      flags.current.talking = true;
      setTalking(true);
      void engine.ctx.resume().catch(() => {});

      const fetchPiece = (piece: string): Promise<Blob | null> =>
        fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: piece }),
        })
          .then((response) => (response.ok ? response.blob() : null))
          .catch(() => null);

      const play = (blob: Blob) =>
        new Promise<void>((resolve) => {
          const url = URL.createObjectURL(blob);
          const done = () => {
            engine.audio.onended = null;
            engine.audio.onerror = null;
            engine.endPlayback = null;
            URL.revokeObjectURL(url);
            resolve();
          };
          engine.endPlayback = done;
          engine.audio.onended = done;
          engine.audio.onerror = done;
          engine.audio.src = url;
          engine.audio.play().catch(done);
        });

      void (async () => {
        let upcoming = fetchPiece(pieces[0]);
        for (let i = 0; i < pieces.length; i += 1) {
          const blob = await upcoming;
          if (token !== engine.speakToken) return;
          // The next sentence is prepared while this one plays.
          if (i + 1 < pieces.length) upcoming = fetchPiece(pieces[i + 1]);
          if (blob) await play(blob);
          if (token !== engine.speakToken) return;
        }
        flags.current.talking = false;
        setTalking(false);
      })();
    },
    [stopPlayback],
  );

  /** Cuts the assistant's voice short, for example when the conversation is reset. */
  const silence = useCallback(() => {
    const engine = engineRef.current;
    if (engine) stopPlayback(engine);
    flags.current.talking = false;
    setTalking(false);
  }, [stopPlayback]);

  useEffect(
    () => () => {
      window.clearTimeout(noticeTimer.current);
      stop();
    },
    [stop],
  );

  const phase: LivePhase = useMemo(() => {
    if (!active) return error ? "error" : "off";
    if (talking) return "speaking";
    if (busy || transcribing) return "thinking";
    if (muted) return "muted";
    if (heard) return "listening";
    return "waiting";
  }, [active, error, talking, busy, transcribing, muted, heard]);

  return { supported, active, muted, phase, error, notice, levelRef, start, stop, toggleMute, speak, silence };
}
