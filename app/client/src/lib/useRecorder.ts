import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 120;
const SILENCE_HINT_AFTER_MS = 2500;

/** Picks a recording format the browser supports (Chrome/Firefox: WebM, Firefox fallback: Ogg, Safari: MP4). */
function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
}

export type RecorderPhase = "idle" | "requesting" | "recording";

/** Why recording cannot work here, or null if it can. */
export function recordingUnavailableReason(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return `Запись голоса в браузере работает только на защищённом адресе. Откройте приложение по адресу http://localhost:${location.port || "5173"} (сейчас открыто: ${location.host}).`;
  }
  if (typeof MediaRecorder === "undefined") return "Этот браузер не умеет записывать звук. Используйте последнюю версию Firefox, Chrome или Safari.";
  return null;
}

const isFirefox = () => typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
const isMac = () => typeof navigator !== "undefined" && /mac/i.test(navigator.platform || navigator.userAgent);

/** Turns a getUserMedia / MediaRecorder failure into a concrete, actionable Russian message. */
export function describeMicError(err: unknown): string {
  const name = (err as DOMException)?.name ?? "";
  const browser = isFirefox() ? "Firefox" : "браузер";
  const macHint = isMac()
    ? ` Также проверьте macOS: Системные настройки → Конфиденциальность и безопасность → Микрофон → включите ${browser}, затем полностью перезапустите ${browser}.`
    : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return (
        `Доступ к микрофону запрещён. ${
          isFirefox()
            ? "В Firefox нажмите на значок микрофона или замка слева от адреса сайта и снимите блокировку, затем обновите страницу."
            : "Разрешите микрофон в настройках сайта (значок слева от адреса) и обновите страницу."
        }` + macHint
      );
    case "NotFoundError":
    case "DevicesNotFoundError":
      return `Микрофон не найден. Проверьте, что он подключён и выбран как устройство ввода${isMac() ? " (Системные настройки → Звук → Вход)" : ""}.`;
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return `Микрофон недоступен: его занимает другое приложение (Zoom, Telegram, Discord) или его блокирует система.${macHint}`;
    case "SecurityError":
      return recordingUnavailableReason() ?? "Браузер запретил доступ к микрофону на этой странице.";
    case "OverconstrainedError":
      return "Микрофон не поддерживает нужные параметры записи. Выберите другое устройство ввода.";
    default:
      return `Не удалось включить микрофон (${name || "неизвестная ошибка"}).${macHint}`;
  }
}

/**
 * Tap-to-start / tap-to-stop microphone recording with a live input level,
 * so the user can see that the microphone actually hears them.
 */
export function useRecorder(onDone: (audio: Blob) => void, onError: (message: string) => void) {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0); // 0..1
  const [silent, setSilent] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const meterRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);

  const cleanup = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (meterRef.current) {
      cancelAnimationFrame(meterRef.current.raf);
      void meterRef.current.ctx.close().catch(() => {});
      meterRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLevel(0);
    setSilent(false);
    setPhase("idle");
  };

  useEffect(() => cleanup, []);

  function startMeter(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const started = performance.now();
      let peak = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) * (v - 128);
        const rms = Math.sqrt(sum / data.length) / 128;
        const lvl = Math.min(1, rms * 4);
        peak = Math.max(peak, lvl);
        setLevel(lvl);
        setSilent(performance.now() - started > SILENCE_HINT_AFTER_MS && peak < 0.02);
        meterRef.current!.raf = requestAnimationFrame(tick);
      };
      meterRef.current = { ctx, raf: requestAnimationFrame(tick) };
    } catch {
      /* the level meter is a convenience; recording works without it */
    }
  }

  async function start() {
    const unavailable = recordingUnavailableReason();
    if (unavailable) return onError(unavailable);
    setPhase("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      console.warn("[voice] getUserMedia failed:", err);
      setPhase("idle");
      return onError(describeMicError(err));
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      recorder = new MediaRecorder(stream); // some Firefox versions reject an explicit type: use the default
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onerror = (e) => {
      console.warn("[voice] MediaRecorder error:", e);
      cleanup();
      onError("Запись прервалась. Попробуйте ещё раз.");
    };
    recorder.onstop = () => {
      const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
      cleanup();
      const blob = new Blob(chunks, { type });
      if (blob.size < 1000) return onError("Запись получилась пустой. Нажмите микрофон, скажите фразу и только потом нажмите ■.");
      onDone(blob);
    };
    recorderRef.current = recorder;
    recorder.start(250); // collect data regularly so a long recording is not lost at the end
    startMeter(stream);
    setSeconds(0);
    setPhase("recording");
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stop();
        return s + 1;
      });
    }, 1000);
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return { phase, recording: phase === "recording", requesting: phase === "requesting", seconds, level, silent, start, stop };
}
