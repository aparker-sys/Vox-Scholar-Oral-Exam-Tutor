/**
 * Voice hooks and helpers. Kept in a separate module from VoiceTutor.jsx
 * to avoid "Cannot access before initialization" in production bundle (circular/top-level order).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { loadStorage, STORAGE_KEYS, fetchTTSAudio } from "../api/client";

var cachedPreferredVoice = null;

var FEMALE_NAME_HINTS = [
  "samantha", "karen", "victoria", "moira", "tessa", "fiona", "alice", "luciana",
  "linda", "susan", "laura", "zira", "catherine", "claire", "emily", "female",
  "woman", "google uk english female", "microsoft zira", "google us english",
];
var MALE_NAME_HINTS = [
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

var voiceListInited = false;
export function initVoiceList() {
  if (typeof window === "undefined" || !window.speechSynthesis || voiceListInited) return;
  voiceListInited = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedPreferredVoice = null;
    getPreferredVoice();
  };
}

var PITCH_VARY = [0.98, 1.0, 1.02, 1.01];
var RATE_VARY = [0.88, 0.91, 0.89, 0.92];

export function applyNaturalSpeech(u, chunkIndex = 0) {
  const i = chunkIndex % PITCH_VARY.length;
  u.rate = RATE_VARY[i];
  u.pitch = PITCH_VARY[i];
  u.volume = 1;
  const voice = getPreferredVoice();
  if (voice) u.voice = voice;
}

export function chunkForSpeaking(text) {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length <= 1) return [t];
  return parts;
}

export function speakWithVariation(text, { onStart, onEnd }) {
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

function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useSpeechRecognition(onResult, onError) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.isFinal ? result[0]?.transcript?.trim() : "";
      if (transcript) onResultRef.current?.(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== "aborted") onErrorRef.current?.(event.error);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch (_) {}
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      onErrorRef.current?.(e.message || "Could not start listening");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
  }, [isListening]);

  return {
    supported: isSpeechRecognitionSupported(),
    isListening,
    startListening,
    stopListening,
  };
}

export function useSessionAnswerRecognition(onChunk, onError) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const onChunkRef = useRef(onChunk);
  const onErrorRef = useRef(onError);
  onChunkRef.current = onChunk;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && result[0]?.transcript) {
          const transcript = result[0].transcript.trim();
          if (transcript) onChunkRef.current?.(transcript);
        }
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== "aborted") onErrorRef.current?.(event.error);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch (_) {}
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      onErrorRef.current?.(e.message || "Could not start listening");
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
  }, []);

  return {
    supported: isSpeechRecognitionSupported(),
    isListening,
    start,
    stop,
  };
}
