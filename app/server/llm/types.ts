/**
 * Model-agnostic interface for structured (JSON) generation.
 * Business logic depends only on this interface, never on a specific provider or model.
 */

export interface StructuredRequest {
  system: string;
  user: string;
  /** Name of the output schema (letters, digits, underscores). */
  schemaName: string;
  /** JSON Schema the model output must follow. */
  jsonSchema: Record<string, unknown>;
}

export interface LlmUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
}

export interface StructuredResponse {
  /** Parsed JSON returned by the model (not yet validated by the caller). */
  data: unknown;
  /** Raw text, kept for diagnostics. */
  rawText: string;
  model: string;
  usage: LlmUsage;
  durationMs: number;
}

export type LlmErrorKind =
  | "not_configured" // no API key
  | "timeout"
  | "upstream" // provider/network error
  | "invalid_output"; // response was not valid JSON / was truncated

export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly status: number | null;
  constructor(kind: LlmErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "LlmError";
    this.kind = kind;
    this.status = status;
  }
}

export interface LlmClient {
  readonly model: string;
  generateStructured(request: StructuredRequest): Promise<StructuredResponse>;
}
