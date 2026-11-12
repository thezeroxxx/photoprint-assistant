/**
 * Server entry point: wires configuration, storage and the model client into the app.
 */
import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { OpenRouterClient } from "./llm/openrouter.ts";
import { SqliteRepository } from "./storage/sqlite.ts";

const repo = new SqliteRepository(config.dbPath);
const llm = new OpenRouterClient({
  apiKey: config.apiKey,
  model: config.model,
  timeoutMs: config.llmTimeoutMs,
  maxTokens: config.llmMaxTokens,
  reasoningEffort: config.reasoningEffort,
  temperature: config.temperature,
});

const app = createApp({
  repo,
  llm,
  limits: { minTranscriptChars: config.minTranscriptChars, maxTranscriptChars: config.maxTranscriptChars },
  staticDir: "dist/client",
});

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`Photoprint Assistant API on http://localhost:${config.port}  (model: ${config.model})`);
  if (!config.apiKey) console.warn("OPENROUTER_API_KEY is not set: analysis requests will return 503.");
});

const shutdown = () => {
  server.close(() => {
    repo.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
