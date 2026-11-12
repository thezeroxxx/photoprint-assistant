/**
 * Speech-to-text boundary. The app depends only on this interface, so the provider or model
 * (currently Whisper via OpenRouter) can be replaced without touching the routes.
 * Errors are reported as LlmError (same kinds: not_configured, timeout, upstream, invalid_output).
 */

export const AUDIO_FORMATS = ["webm", "m4a", "mp3", "wav", "ogg"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

export interface Transcription {
  text: string;
  model: string;
  durationMs: number;
}

export interface SpeechToText {
  readonly model: string;
  transcribe(audio: Buffer, format: AudioFormat): Promise<Transcription>;
}

/** Maps a browser upload's Content-Type to an audio format the provider accepts. */
export function formatFromContentType(contentType: string | undefined): AudioFormat | null {
  const ct = (contentType ?? "").toLowerCase().split(";")[0]?.trim() ?? "";
  if (ct === "audio/webm" || ct === "video/webm") return "webm";
  if (ct === "audio/mp4" || ct === "audio/x-m4a" || ct === "audio/m4a" || ct === "audio/aac" || ct === "video/mp4") return "m4a";
  if (ct === "audio/mpeg" || ct === "audio/mp3") return "mp3";
  if (ct === "audio/wav" || ct === "audio/x-wav" || ct === "audio/wave") return "wav";
  if (ct === "audio/ogg" || ct === "audio/opus") return "ogg";
  return null;
}
