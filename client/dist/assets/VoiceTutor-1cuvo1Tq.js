import { j as jsxRuntimeExports } from "./index-DnCVQQRO.js";
import { a as reactExports, i as initVoiceList, e as chunkForSpeaking, s as speakWithVariation, f as applyNaturalSpeech } from "./voice-D-4X00XL.js";
import { f as fetchTTSAudio } from "./api-CXkl7B-R.js";
function VoiceTutor({
  onSpeak,
  className = "",
  label = "Your tutor",
  idleMessage = "Tap to hear me",
  size = "medium",
  /** When provided, parent controls speech and we just show the wave */
  isSpeaking: isSpeakingExternal
}) {
  const canvasRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const ttsUrlRef = reactExports.useRef(null);
  const [isSpeakingInternal, setIsSpeakingInternal] = reactExports.useState(false);
  const [speechSupported, setSpeechSupported] = reactExports.useState(false);
  const [ttsFallbackReason, setTtsFallbackReason] = reactExports.useState("");
  const rafRef = reactExports.useRef(null);
  const phaseRef = reactExports.useRef(0);
  const isSpeaking = isSpeakingExternal !== void 0 ? isSpeakingExternal : isSpeakingInternal;
  reactExports.useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSpeechSupported(ok);
    if (ok) initVoiceList();
    return () => {
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);
  const speak = reactExports.useCallback(
    async (text) => {
      const trimmed = text == null ? void 0 : text.trim();
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
      setTtsFallbackReason("");
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
          console.info("[Charlotte TTS] Using backend (natural voice)");
          onSpeak == null ? void 0 : onSpeak(text);
          return;
        }
        setTtsFallbackReason("TTS not configured on server");
        console.warn("[Charlotte TTS] Backend returned no audio (503). Using browser voice.");
      } catch (err) {
        const msg = (err == null ? void 0 : err.message) || "Request failed";
        setTtsFallbackReason(
          msg.includes("429") ? "Too many requests—wait a minute and try again." : msg
        );
        console.warn("[Charlotte TTS] Backend failed:", msg, "— using browser voice.");
      }
      if (!hasFallback) return;
      const chunks = chunkForSpeaking(trimmed);
      const useVariation = chunks.length > 1;
      if (useVariation) {
        speakWithVariation(trimmed, {
          onStart: () => setIsSpeakingInternal(true),
          onEnd: () => setIsSpeakingInternal(false)
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
      onSpeak == null ? void 0 : onSpeak(text);
    },
    [speechSupported, onSpeak]
  );
  reactExports.useEffect(() => {
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
        const x = i / steps * w;
        const y = midY + amplitude * Math.sin(i / steps * Math.PI * freq * 2 + phase) + (isSpeaking ? 2 * Math.sin(i / steps * 4 + phase * 1.5) : 0);
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
  reactExports.useCallback(() => {
    if (onSpeak) return;
    if (speechSupported) {
      speak(idleMessage);
    }
  }, [speechSupported, speak, idleMessage, onSpeak]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `voice-tutor voice-tutor--${size} ${className}`,
      role: "region",
      "aria-label": label,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "voice-tutor__wave-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "canvas",
          {
            ref: canvasRef,
            className: "voice-tutor__canvas",
            width: size === "small" ? 160 : 240,
            height: size === "small" ? 48 : 72,
            "aria-hidden": "true"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "voice-tutor__footer", children: [
          speechSupported && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "voice-tutor__hint", children: isSpeaking ? "Speaking…" : idleMessage }),
          ttsFallbackReason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "voice-tutor__hint voice-tutor__hint--fallback", role: "status", children: [
            "Using browser voice — ",
            ttsFallbackReason
          ] }),
          !speechSupported && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "voice-tutor__hint voice-tutor__hint--muted", children: "Voice not supported in this browser" })
        ] })
      ]
    }
  );
}
export {
  VoiceTutor,
  VoiceTutor as default
};
