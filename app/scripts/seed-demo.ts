/**
 * Loads the demo meetings (samples/demo-transcript-ru.txt + samples/demo/*.txt) into the local database:
 * each transcript is analyzed by the real model and gets its own chat with the transcript and the report card.
 *
 * Idempotent: a transcript that already has a successful report is skipped (no model call, no cost).
 * Cost: about $0.0025 per new meeting with anthropic/claude-haiku-5.5.
 *
 * Usage (from app/): npm run seed:demo
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../server/config.ts";
import { analyzeMeeting } from "../server/analysis/analyzeMeeting.ts";
import { OpenRouterClient } from "../server/llm/openrouter.ts";
import { SqliteRepository } from "../server/storage/sqlite.ts";

if (!config.apiKey) {
  console.error("OPENROUTER_API_KEY is not set in .env");
  process.exit(1);
}

const files = [
  "samples/demo-transcript-ru.txt",
  ...readdirSync("samples/demo")
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .map((f) => join("samples/demo", f)),
];

const repo = new SqliteRepository(config.dbPath);
const llm = new OpenRouterClient({
  apiKey: config.apiKey,
  model: config.model,
  timeoutMs: config.llmTimeoutMs,
  maxTokens: config.llmMaxTokens,
  reasoningEffort: config.reasoningEffort,
  temperature: config.temperature,
});

let added = 0;
let cost = 0;
for (const file of files) {
  const transcript = readFileSync(file, "utf8").trim();
  if (repo.findReportIdByTranscript(transcript)) {
    console.log(`skip  ${file} (already analyzed)`);
    continue;
  }
  try {
    const result = await analyzeMeeting(llm, transcript, null);
    const stored = repo.createTranscript({ title: null, content: transcript, source: "paste" });
    const detail = repo.createReport({
      transcriptId: stored.id,
      status: "pending_review",
      title: result.report.meeting_title,
      report: result.report,
      errorMessage: null,
      model: result.model,
      promptVersion: result.promptVersion,
      usage: result.usage,
      durationMs: result.durationMs,
    });
    const chat = repo.createChat(detail.title);
    repo.addMessage({ chatId: chat.id, role: "user", kind: "transcript", text: transcript, reportId: null });
    repo.addMessage({
      chatId: chat.id,
      role: "assistant",
      kind: "meeting_report",
      text: `Разобрал встречу «${detail.title}».`,
      reportId: detail.id,
    });
    added++;
    cost += result.usage.costUsd ?? 0;
    const r = result.report;
    console.log(
      `added ${file} → «${detail.title}»: ${r.decisions.length} decisions, ${r.commitments.length} commitments, ` +
        `${r.needs_clarification.length} to clarify (${(result.durationMs / 1000).toFixed(1)} s)`,
    );
  } catch (err) {
    console.log(`FAILED ${file}: ${(err as Error).message}`);
  }
}
repo.close();
console.log(`\nDone: ${added} new meeting(s), model cost $${cost.toFixed(4)}.`);
