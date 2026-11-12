/**
 * Whisper speech-to-text through OpenRouter's /audio/transcriptions endpoint (same API key as the chat model).
 */
import { LlmError } from "../llm/types.ts";
import type { AudioFormat, SpeechToText, Transcription } from "./types.ts";

const ENDPOINT = "https://openrouter.ai/api/v1/audio/transcriptions";

export interface OpenRouterSttOptions {
  apiKey: string;
  model: string;
  /** ISO-639-1 code; improves accuracy for Russian. */
  language: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export class OpenRouterSpeechToText implements SpeechToText {
  readonly model: string;
  private readonly opts: OpenRouterSttOptions;

  constructor(opts: OpenRouterSttOptions) {
    this.opts = opts;
    this.model = opts.model;
  }

  async transcribe(audio: Buffer, format: AudioFormat): Promise<Transcription> {
    if (!this.opts.apiKey) throw new LlmError("not_configured", "OpenRouter API key is not configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    const started = Date.now();
    let res: Response;
    try {
      res = await (this.opts.fetchImpl ?? fetch)(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.opts.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.opts.model,
          input_audio: { data: audio.toString("base64"), format },
          language: this.opts.language,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (controller.signal.aborted) throw new LlmError("timeout", `Transcription took longer than ${this.opts.timeoutMs} ms`);
      throw new LlmError("upstream", `Network error: ${(err as Error).message}`);
    }
    const payload = (await res.json().catch(() => null)) as { text?: unknown; error?: { message?: string } } | null;
    clearTimeout(timer);
    if (!res.ok || !payload || payload.error) {
      throw new LlmError("upstream", `Transcription error: ${payload?.error?.message ?? `HTTP ${res.status}`}`, res.status);
    }
    if (typeof payload.text !== "string") throw new LlmError("invalid_output", "Transcription response has no text");
    return { text: payload.text.trim(), model: this.opts.model, durationMs: Date.now() - started };
  }
}
