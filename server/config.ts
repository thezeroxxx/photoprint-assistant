/**
 * Reads configuration from environment variables (and .env if present).
 * The API key is never logged or returned by the API.
 */
import { z } from "zod";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the real environment.
}

const ConfigSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().default(""),
  OPENROUTER_MODEL: z.string().trim().min(1).default("anthropic/claude-haiku-5.5"),
  LLM_REASONING_EFFORT: z.string().trim().default(""),
  LLM_TEMPERATURE: z.string().trim().default(""),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(4_000),
  MIN_TRANSCRIPT_CHARS: z.coerce.number().int().nonnegative().default(50),
  MAX_TRANSCRIPT_CHARS: z.coerce.number().int().positive().default(60_000),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().trim().min(1).default("data/app.db"),
});

const raw = Object.fromEntries(
  Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ""),
);
const parsed = ConfigSchema.parse(raw);

export const config = {
  apiKey: parsed.OPENROUTER_API_KEY,
  model: parsed.OPENROUTER_MODEL,
  reasoningEffort: parsed.LLM_REASONING_EFFORT || null,
  temperature: parsed.LLM_TEMPERATURE === "" ? null : Number(parsed.LLM_TEMPERATURE),
  llmTimeoutMs: parsed.LLM_TIMEOUT_MS,
  llmMaxTokens: parsed.LLM_MAX_TOKENS,
  minTranscriptChars: parsed.MIN_TRANSCRIPT_CHARS,
  maxTranscriptChars: parsed.MAX_TRANSCRIPT_CHARS,
  port: parsed.PORT,
  dbPath: parsed.DB_PATH,
} as const;

export type AppConfig = typeof config;
