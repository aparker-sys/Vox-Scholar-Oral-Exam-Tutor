import { useState, useRef, useEffect, useCallback } from "react";
import { loadStorage, STORAGE_KEYS, fetchTTSAudio } from "../api/client";

let cachedPreferredVoice = null;

/** Known voice names that are typically female (by convention of OS/browser). */
const FEMALE_NAME_HINTS = [
  "samantha", "karen", "victoria", "moira", "tessa", "fiona", "alice", "luciana",
  "linda", "susan", "laura", "zira", "catherine", "claire", "emily", "female",
  "woman", "google uk english female", "microsoft zira", "google us english",
];
/** Known voice names that are typically male. */
const MALE_NAME_HINTS = [
  "alex", "daniel", "ralph", "bruce", "fred", "tom", "david", "mark", "paul",
  "male", "man", "google uk english male", "microsoft david",
];

function inferVoiceGender(voice) {
  const name = (voice.name || "").toLowerCase();
  const uri = (voice.voiceURI || "").toLowerCase();
  const combined = name + " " + uri;
  if (FEMALE_NAME_HINTS.some((h) => combined.includes(h))) return "Female";
  if (MALE_NAME_HINTS.some((h) => combined.includes(h))) return "Male";
  return "Other";
}

/** Get voices with gender labels for UI: { id, label, voice, gender }. */
export function getVoicesWithGender() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  const lang = "en";
  const enVoices = voices.filter((v) => v.lang.startsWith(lang));
  const pool = enVoices.length ? enVoices : voices;
  const withGender = pool.map((v) => ({
    id: v.voiceURI || v.name,
    label: `${inferVoiceGender(v)} — ${v.name}`,
    voice: v,
    gender: inferVoiceGender(v),
  }));
  const order = { Female: 0, Male: 1, Other: 2 };
  withGender.sort((a, b) => order[a.gender] - order[b.gender] || a.label.localeCompare(b.label));
  return withGender;
}

/** Prefer a more natural-sounding voice when available. */
function getPreferredVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const savedId = loadStorage(STORAGE_KEYS.charlotteVoice, null);
  if (savedId) {
    const found = voices.find((v) => (v.voiceURI || v.name) === savedId);
    if (found) return found;
  }
  if (cachedPreferredVoice) return cachedPreferredVoice;
  const preferred = [
    "Samantha", "Karen", "Victoria", "Google US English", "Microsoft Zira",
    "natural", "premium", "enhanced",
  ];
  const byLang = voices.filter((v) => v.lang.startsWith("en"));
  const pool = byLang.length ? byLang : voices;
  for (const keyword of preferred) {
    const found = pool.find(
      (v) =>
        v.name.includes(keyword) ||
        (v.voiceURI && v.voiceURI.toLowerCase().includes(keyword))
    );
    if (found) {
      cachedPreferredVoice = found;
      return found;
    }
  }
  cachedPreferredVoice = pool[0] || voices[0];
  return cachedPreferredVoice;
}

let voiceListInited = false;
function initVoiceList() {
  if (typeof window === "undefined" || !window.speechSynthesis || voiceListInited) return;
  voiceListInited = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedPreferredVoice = null;
    getPreferredVoice();
  };
}

/** Slight variation per chunk to sound less monotone (pitch and rate). */
const PITCH_VARY = [0.98, 1.0, 1.02, 1.01];
const RATE_VARY = [0.88, 0.91, 0.89, 0.92];

/** Apply natural-sounding settings to an utterance; optional chunkIndex for variation. */
function applyNaturalSpeech(u, chunkIndex = 0) {
  const i = chunkIndex % PITCH_VARY.length;
  u.rate = RATE_VARY[i];
  u.pitch = PITCH_VARY[i];
  u.volume = 1;
  const voice = getPreferredVoice();
  if (voice) u.voice = voice;
}

/**
 * Personal voice assistant: sine-wave visualization + text-to-speech.
 * No human face — just an animated wave that moves more when speaking.
 */
export function VoiceTutor({
  onSpeak,
  className = "",
  label = "Your tutor",
  idleMessage = "Tap to hear me",
  size = "medium",
  /** When provided, parent controls speech and we just show the wave */
  isSpeaking: isSpeakingExternal,
}) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const ttsUrlRef = useRef(null);
  const [isSpeakingInternal, setIsSpeakingInternal] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  const isSpeaking =
    isSpeakingExternal !== undefined ? isSpeakingExternal : isSpeakingInternal;

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    setSpeechSupported(ok);
    if (ok) initVoiceList();
    return () => {
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const speak = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      const hasFallback = typeof window !== "undefined" && window.speechSynthesis;

      const stopTTSPlayback = () => {
        if (ttsUrlRef.current) {
          URL.revokeObjectURL(ttsUrlRef.current);
          ttsUrlRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
      };

      try {
        const blob = await fetchTTSAudio(trimmed);
        if (blob) {
          stopTTSPlayback();
          const url = URL.createObjectURL(blob);
          ttsUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onplay = () => setIsSpeakingInternal(true);
          audio.onended = () => {
            setIsSpeakingInternal(false);
            stopTTSPlayback();
          };
          audio.onerror = () => {
            setIsSpeakingInternal(false);
            stopTTSPlayback();
          };
          await audio.play();
          onSpeak?.(text);
          return;
        }
      } catch (_) {
        /* fall back to speechSynthesis */
      }

      if (!hasFallback) return;
      const chunks = chunkForSpeaking(trimmed);
      const useVariation = chunks.length > 1;
      if (useVariation) {
        speakWithVariation(trimmed, {
          onStart: () => setIsSpeakingInternal(true),
          onEnd: () => setIsSpeakingInternal(false),
        });
      } else {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(trimmed);
        applyNaturalSpeech(u, 0);
        u.onstart = () => setIsSpeakingInternal(true);
        u.onend = () => setIsSpeakingInternal(false);
        u.onerror = () => setIsSpeakingInternal(false);
        window.speechSynthesis.speak(u);
      }
      onSpeak?.(text);
    },
    [speechSupported, onSpeak]
  );

  // Sine wave animation: idle = gentle, speaking = larger amplitude + faster
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;

    const setSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!canvasRef.current || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width !== width || rect.height !== height) setSize();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      phaseRef.current += isSpeaking ? 0.12 : 0.04;
      const phase = phaseRef.current;
      const midY = h / 2;
      const amplitude = isSpeaking ? Math.min(18, 8 + 10 * (0.5 + 0.5 * Math.sin(phase * 0.5))) : 6;
      const freq = isSpeaking ? 2.2 : 1.4;
      const steps = 120;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const y =
          midY +
          amplitude * Math.sin((i / steps) * Math.PI * freq * 2 + phase) +
          (isSpeaking ? 2 * Math.sin((i / steps) * 4 + phase * 1.5) : 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "rgba(45, 157, 120, 0.35)");
      gradient.addColorStop(0.5, "rgba(45, 157, 120, 0.85)");
      gradient.addColorStop(1, "rgba(45, 157, 120, 0.35)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isSpeaking ? 2.5 : 1.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };

    setSize();
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSpeaking]);

  const handleTap = useCallback(() => {
    if (onSpeak) return; // Parent controls what to speak
    if (speechSupported) {
      speak(idleMessage);
    }
  }, [speechSupported, speak, idleMessage, onSpeak]);

  return (
    <div
      className={`voice-tutor voice-tutor--${size} ${className}`}
      role="region"
      aria-label={label}
    >
      <div className="voice-tutor__wave-wrap">
        <canvas
          ref={canvasRef}
          className="voice-tutor__canvas"
          width={size === "small" ? 160 : 240}
          height={size === "small" ? 48 : 72}
          aria-hidden="true"
        />
      </div>
      <div className="voice-tutor__footer">
        {speechSupported && (
          <p className="voice-tutor__hint">
            {isSpeaking ? "Speaking…" : idleMessage}
          </p>
        )}
        {!speechSupported && (
          <p className="voice-tutor__hint voice-tutor__hint--muted">
            Voice not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
}

/** Split text into sentence-like chunks for more natural pacing and variation. */
function chunkForSpeaking(text) {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length <= 1) return [t];
  return parts;
}

/**
 * Speak text with less monotone: chunk by sentences and vary pitch/rate per chunk.
 * onStart called once, onEnd called when all chunks finish.
 */
function speakWithVariation(text, { onStart, onEnd }) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text?.trim()) return;
  window.speechSynthesis.cancel();
  const chunks = chunkForSpeaking(text);
  if (chunks.length === 0) return;
  let index = 0;
  function speakNext() {
    if (index >= chunks.length) {
      onEnd?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[index]);
    applyNaturalSpeech(u, index);
    if (index === 0) u.onstart = onStart;
    u.onend = () => {
      index++;
      speakNext();
    };
    u.onerror = () => {
      index++;
      speakNext();
    };
    window.speechSynthesis.speak(u);
  }
  speakNext();
}

/**
 * Speak a short sample with a specific voice (for Settings preview).
 * Uses the voice's own name in the intro (e.g. "Hi, I'm Samantha").
 * voiceId: optional saved voice id; if empty, uses default preferred voice.
 * voiceOptions: array of { id, voice } from getVoicesWithGender().
 */
export function previewVoice(voiceId, voiceOptions) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  let voice = null;
  if (voiceId && Array.isArray(voiceOptions)) {
    const opt = voiceOptions.find((o) => o.id === voiceId);
    if (opt?.voice) voice = opt.voice;
  }
  if (!voice) voice = getPreferredVoice();
  const name = voice?.name?.trim() || "Charlotte";
  const phrase = `Hi, I'm ${name}. This is how I'll sound when I help you practice for your oral exams.`;
  const u = new SpeechSynthesisUtterance(phrase);
  u.rate = 0.92;
  u.pitch = 1.02;
  u.volume = 1;
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

/**
 * Hook to get voice options for Settings (voices with gender labels).
 */
export function useVoiceOptions() {
  const [voiceOptions, setVoiceOptions] = useState([]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    function update() {
      setVoiceOptions(getVoicesWithGender());
    }
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  return { voiceOptions };
}

/**
 * Hook to get a stable speak function and current speaking state for the tutor.
 * Uses backend TTS when configured, otherwise speechSynthesis.
 */
export function useVoiceTutor() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const ttsUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const speak = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    const hasFallback = typeof window !== "undefined" && window.speechSynthesis;

    const stopTTSPlayback = () => {
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };

    try {
      const blob = await fetchTTSAudio(trimmed);
      if (blob) {
        stopTTSPlayback();
        const url = URL.createObjectURL(blob);
        ttsUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          stopTTSPlayback();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          stopTTSPlayback();
        };
        await audio.play();
        return;
      }
    } catch (_) {
      /* fall back to speechSynthesis */
    }

    if (!hasFallback) return;
    const chunks = chunkForSpeaking(trimmed);
    const useVariation = chunks.length > 1;
    if (useVariation) {
      speakWithVariation(trimmed, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    } else {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(trimmed);
      applyNaturalSpeech(u, 0);
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, []);

  return { speak, isSpeaking };
}

export default VoiceTutor;
