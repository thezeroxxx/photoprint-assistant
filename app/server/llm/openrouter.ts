/**
 * OpenRouter implementation of LlmClient (OpenAI-compatible chat completions API).
 * Requests strict JSON-schema output and asks OpenRouter to route only to providers
 * that support it.
 */
import { LlmError, type LlmClient, type StructuredRequest, type StructuredResponse } from "./types.ts";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Keywords some providers reject in strict mode; validation still happens server-side with Zod. */
const UNSUPPORTED_KEYWORDS = new Set(["$schema", "minLength", "maxLength", "minItems", "maxItems", "pattern", "format"]);

export function sanitizeJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeJsonSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (UNSUPPORTED_KEYWORDS.has(key)) continue;
      out[key] = key === "properties" && value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeJsonSchema(v)]))
        : sanitizeJsonSchema(value);
    }
    return out;
  }
  return node;
}

export interface OpenRouterOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  reasoningEffort: string | null;
  /** null = do not send (recommended unless the model supports it). */
  temperature: number | null;
  fetchImpl?: typeof fetch;
}

interface ChatCompletion {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string | null }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  error?: { message?: string; code?: number | string };
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export class OpenRouterClient implements LlmClient {
  readonly model: string;
  private readonly opts: OpenRouterOptions;

  constructor(opts: OpenRouterOptions) {
    this.opts = opts;
    this.model = opts.model;
  }

  async generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
    if (!this.opts.apiKey) {
      throw new LlmError("not_configured", "OpenRouter API key is not configured");
    }
    const body: Record<string, unknown> = {
      model: this.opts.model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: req.schemaName, strict: true, schema: sanitizeJsonSchema(req.jsonSchema) },
      },
      provider: { require_parameters: true },
      max_tokens: this.opts.maxTokens,
      usage: { include: true },
    };
    // Optional: many current models reject these, and require_parameters would then find no provider.
    if (this.opts.temperature !== null) body.temperature = this.opts.temperature;
    if (this.opts.reasoningEffort) body.reasoning = { effort: this.opts.reasoningEffort };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    const started = Date.now();
    let res: Response;
    try {
      res = await (this.opts.fetchImpl ?? fetch)(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.opts.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (controller.signal.aborted) throw new LlmError("timeout", `Model did not respond within ${this.opts.timeoutMs} ms`);
      throw new LlmError("upstream", `Network error: ${(err as Error).message}`);
    }

    let payload: ChatCompletion;
    try {
      payload = (await res.json()) as ChatCompletion;
    } catch {
      clearTimeout(timer);
      throw new LlmError("upstream", `Unreadable response from OpenRouter (HTTP ${res.status})`, res.status);
    } finally {
      clearTimeout(timer);
    }
    const durationMs = Date.now() - started;

    if (!res.ok || payload.error) {
      const msg = payload.error?.message ?? `HTTP ${res.status}`;
      throw new LlmError("upstream", `OpenRouter error: ${msg}`, res.status);
    }

    const choice = payload.choices?.[0];
    const rawText = choice?.message?.content ?? "";
    if (choice?.finish_reason === "length") {
      throw new LlmError("invalid_output", "Model output was truncated (max tokens reached)");
    }
    let data: unknown;
    try {
      data = JSON.parse(stripFences(rawText));
    } catch {
      throw new LlmError("invalid_output", "Model output is not valid JSON");
    }

    return {
      data,
      rawText,
      model: payload.model ?? this.opts.model,
      durationMs,
      usage: {
        promptTokens: num(payload.usage?.prompt_tokens),
        completionTokens: num(payload.usage?.completion_tokens),
        totalTokens: num(payload.usage?.total_tokens),
        costUsd: num(payload.usage?.cost),
      },
    };
  }
}

/** Some models wrap JSON in ```json fences despite instructions. */
function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m?.[1] ?? t;
}
