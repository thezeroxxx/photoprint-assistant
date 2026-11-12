/**
 * Compares models on the Russian sample transcript against the answer key.
 * Usage: npm run compare -- [modelA] [modelB] ... [--runs=N]
 * Default: anthropic/claude-haiku-5.5 vs openai/gpt-6-luna, 2 runs each.
 * Costs a few tenths of a cent per run on cheap models.
 */
import { readFileSync } from "node:fs";
import { config } from "../server/config.ts";
import { analyzeMeeting } from "../server/analysis/analyzeMeeting.ts";
import { OpenRouterClient } from "../server/llm/openrouter.ts";
import type { MeetingReport } from "../shared/report.ts";

interface Expected {
  decisions: { id: string; keywords: string[] }[];
  commitments: { id: string; owner: string[]; action: string[]; deadline: string | null }[];
  needs_clarification: { id: string; keywords: string[]; missing: string[] }[];
  open_questions: { id: string; keywords: string[] }[];
  must_not_be_commitments: string[];
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/ё/g, "е");
const hasAll = (text: string, kws: string[]) => kws.every((k) => norm(text).includes(norm(k)));
const hasAny = (text: string, kws: string[]) => kws.some((k) => norm(text).includes(norm(k)));

function score(r: MeetingReport, e: Expected) {
  const decisions = e.decisions.filter((d) => r.decisions.some((x) => hasAll(x.text, d.keywords))).length;
  let commitments = 0;
  let deadlines = 0;
  for (const c of e.commitments) {
    const hit = r.commitments.find((x) => hasAny(x.owner, c.owner) && hasAll(x.action, c.action));
    if (!hit) continue;
    commitments++;
    if (c.deadline === null ? hit.deadline === null : norm(hit.deadline).includes(norm(c.deadline))) deadlines++;
  }
  const clar = e.needs_clarification.filter((n) =>
    r.needs_clarification.some((x) => hasAny(x.statement + " " + (x.evidence_quote ?? ""), n.keywords) && n.missing.every((m) => x.missing.includes(m as never))),
  ).length;
  const open = e.open_questions.filter((o) => r.open_questions.some((x) => hasAll(x.text, o.keywords))).length;
  const falseCommitments = r.commitments.filter((x) => hasAny(x.action, e.must_not_be_commitments)).length;
  const quoted = [...r.commitments, ...r.needs_clarification];
  const verified = quoted.filter((x) => x.evidence_status === "verified").length;
  const total = e.decisions.length + e.commitments.length * 2 + e.needs_clarification.length + e.open_questions.length;
  const points = decisions + commitments + deadlines + clar + open - falseCommitments;
  return { decisions, commitments, deadlines, clar, open, falseCommitments, verified, quoted: quoted.length, points, total };
}

const args = process.argv.slice(2);
const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] ?? 2);
const models = args.filter((a) => !a.startsWith("--"));
if (models.length === 0) models.push("anthropic/claude-haiku-5.5", "openai/gpt-6-luna");
if (!config.apiKey) {
  console.error("OPENROUTER_API_KEY is not set in .env");
  process.exit(1);
}

const transcript = readFileSync("samples/demo-transcript-ru.txt", "utf8");
const expected = JSON.parse(readFileSync("samples/expected.json", "utf8")) as Expected;
const e = expected;

console.log(`Sample: ${transcript.length} chars. Runs per model: ${runs}.\n`);
for (const model of models) {
  const llm = new OpenRouterClient({
    apiKey: config.apiKey,
    model,
    timeoutMs: config.llmTimeoutMs,
    maxTokens: config.llmMaxTokens,
    reasoningEffort: config.reasoningEffort,
    temperature: config.temperature,
  });
  for (let i = 1; i <= runs; i++) {
    try {
      const res = await analyzeMeeting(llm, transcript, null);
      const s = score(res.report, e);
      console.log(
        `${model} #${i}: score ${s.points}/${s.total} | decisions ${s.decisions}/${e.decisions.length}, ` +
          `commitments ${s.commitments}/${e.commitments.length} (deadlines ${s.deadlines}), clarifications ${s.clar}/${e.needs_clarification.length}, ` +
          `open ${s.open}/${e.open_questions.length}, false commitments ${s.falseCommitments} | quotes verified ${s.verified}/${s.quoted} | ` +
          `${(res.durationMs / 1000).toFixed(1)} s, ${res.usage.totalTokens ?? "?"} tokens, $${res.usage.costUsd?.toFixed(5) ?? "?"}, attempts ${res.attempts}`,
      );
      if (process.env.SHOW_REPORT) console.dir(res.report, { depth: null });
    } catch (err) {
      console.log(`${model} #${i}: FAILED — ${(err as Error).message}`);
    }
  }
}
