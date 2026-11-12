import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 120;

/** Picks a recording format the browser supports (Chrome/Firefox: WebM, Safari: MP4). */
function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
}

export const recordingSupported = () =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

/**
 * Tap-to-start / tap-to-stop microphone recording.
 * Calls onDone with the recorded audio when stopped (or after MAX_SECONDS).
 */
export function useRecorder(onDone: (audio: Blob) => void, onError: (message: string) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanup = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => cleanup, []);

  async function start() {
    if (!recordingSupported()) return onError("Этот браузер не поддерживает запись голоса.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = (err as DOMException).name === "NotAllowedError";
      return onError(denied ? "Нет доступа к микрофону. Разрешите его в настройках браузера." : "Микрофон недоступен.");
    }
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
      const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
      cleanup();
      onDone(new Blob(chunks, { type }));
    };
    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setRecording(true);
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

  return { recording, seconds, start, stop };
}
