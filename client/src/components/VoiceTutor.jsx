import { useState, useRef, useEffect, useCallback } from "react";

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
  const [isSpeakingInternal, setIsSpeakingInternal] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const rafRef = useRef(null);
  const phaseRef = useRef(0);

  const isSpeaking =
    isSpeakingExternal !== undefined ? isSpeakingExternal : isSpeakingInternal;

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window
    );
  }, []);

  const speak = useCallback(
    (text) => {
      if (!speechSupported || !text?.trim()) return;
      const u = new SpeechSynthesisUtterance(text.trim());
      u.rate = 0.95;
      u.pitch = 1;
      u.volume = 1;
      u.onstart = () => setIsSpeakingInternal(true);
      u.onend = () => setIsSpeakingInternal(false);
      u.onerror = () => setIsSpeakingInternal(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
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

/**
 * Hook to get a stable speak function and current speaking state for the tutor.
 */
export function useVoiceTutor() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text?.trim())
      return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  return { speak, isSpeaking };
}

export default VoiceTutor;
