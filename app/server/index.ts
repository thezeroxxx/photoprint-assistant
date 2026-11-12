/**
 * Server entry point: wires configuration, storage and the model client into the app.
 */
import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { OpenRouterClient } from "./llm/openrouter.ts";
import { OpenRouterSpeechToText } from "./stt/openrouter.ts";
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

const stt = new OpenRouterSpeechToText({
  apiKey: config.apiKey,
  model: config.sttModel,
  language: config.sttLanguage,
  timeoutMs: config.llmTimeoutMs,
});

const app = createApp({
  repo,
  llm,
  stt,
  maxAudioMb: config.maxAudioMb,
  limits: { minTranscriptChars: config.minTranscriptChars, maxTranscriptChars: config.maxTranscriptChars },
  staticDir: "dist/client",
});

// Listens on 127.0.0.1 by default. Set HOST=0.0.0.0 in .env to allow other devices
// on the network (e.g. a phone for the demo) — the API has no login, so only on a trusted network.
const server = app.listen(config.port, config.host, () => {
  console.log(`Photoprint Assistant API on http://${config.host}:${config.port}  (model: ${config.model})`);
  if (config.host !== "127.0.0.1" && config.host !== "localhost")
    console.warn(`Listening on ${config.host}: the API is reachable from other devices on this network.`);
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
