/**
 * Core business logic: transcript in, verified MeetingReport out.
 * Depends only on the LlmClient interface (model- and provider-agnostic).
 */
import { z } from "zod";
import {
  ModelReportSchema,
  type ClarificationItem,
  type Commitment,
  type MeetingReport,
  type ModelReport,
} from "../../shared/report.ts";
import { LlmError, type LlmClient, type LlmUsage } from "../llm/types.ts";
import { verifyQuote } from "./evidence.ts";
import { PROMPT_VERSION, SYSTEM_PROMPT, buildUserPrompt } from "./prompt.ts";

const MODEL_JSON_SCHEMA = z.toJSONSchema(ModelReportSchema, { target: "draft-7" }) as Record<string, unknown>;

export interface AnalysisResult {
  report: MeetingReport;
  model: string;
  promptVersion: string;
  usage: LlmUsage;
  durationMs: number;
  attempts: number;
}

/** Values that mean "no deadline / no owner" and must not be shown as real data. */
const EMPTY_VALUE = /^(?:-|—|–|нет|не указан[оа]?|не определен[оа]?|не назван[оа]?|неизвестно|n\/a|null|none|tbd)$/i;
const isEmptyValue = (v: string | null | undefined): boolean => !v || EMPTY_VALUE.test(v.trim());

/**
 * Applies the report rules that must not depend on the model behaving perfectly:
 *  - evidence quotes are kept only if found verbatim in the transcript;
 *  - placeholder deadlines become null ("Не указан");
 *  - a "commitment" without an identifiable owner is moved to Needs Clarification.
 */
export function finalizeReport(raw: ModelReport, transcript: string): MeetingReport {
  const commitments: Commitment[] = [];
  const clarifications: ClarificationItem[] = [];

  for (const c of raw.commitments) {
    const evidence = verifyQuote(transcript, c.evidence_quote);
    const deadline = isEmptyValue(c.deadline) ? null : c.deadline!.trim();
    if (isEmptyValue(c.owner)) {
      clarifications.push({
        statement: c.action,
        missing: deadline ? ["owner"] : ["owner", "deadline"],
        missing_note: "Не назван ответственный.",
        ...evidence,
      });
      continue;
    }
    commitments.push({ action: c.action.trim(), owner: c.owner.trim(), deadline, ...evidence });
  }

  for (const item of raw.needs_clarification) {
    clarifications.push({
      statement: item.statement.trim(),
      missing: [...new Set(item.missing)],
      missing_note: isEmptyValue(item.missing_note) ? null : item.missing_note!.trim(),
      ...verifyQuote(transcript, item.evidence_quote),
    });
  }

  const clean = (items: { text: string }[]) =>
    items.map((i) => ({ text: i.text.trim() })).filter((i) => i.text.length > 0);

  return {
    meeting_title: raw.meeting_title.trim() || "Встреча без названия",
    summary: raw.summary.trim(),
    decisions: clean(raw.decisions),
    commitments,
    needs_clarification: clarifications,
    open_questions: clean(raw.open_questions),
    suggested_next_steps: clean(raw.suggested_next_steps),
  };
}

const sumNullable = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

/** Runs the analysis, retrying once if the model output is invalid. */
export async function analyzeMeeting(
  llm: LlmClient,
  transcript: string,
  title: string | null,
  maxAttempts = 2,
): Promise<AnalysisResult> {
  const usage: LlmUsage = { promptTokens: null, completionTokens: null, totalTokens: null, costUsd: null };
  let durationMs = 0;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await llm.generateStructured({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(transcript, title),
        schemaName: "meeting_report",
        jsonSchema: MODEL_JSON_SCHEMA,
      });
      durationMs += res.durationMs;
      usage.promptTokens = sumNullable(usage.promptTokens, res.usage.promptTokens);
      usage.completionTokens = sumNullable(usage.completionTokens, res.usage.completionTokens);
      usage.totalTokens = sumNullable(usage.totalTokens, res.usage.totalTokens);
      usage.costUsd = sumNullable(usage.costUsd, res.usage.costUsd);

      const parsed = ModelReportSchema.safeParse(res.data);
      if (!parsed.success) {
        lastError = new LlmError("invalid_output", `Model output failed validation: ${parsed.error.message.slice(0, 500)}`);
        continue;
      }
      return {
        report: finalizeReport(parsed.data, transcript),
        model: res.model,
        promptVersion: PROMPT_VERSION,
        usage,
        durationMs,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err;
      // Only malformed output is worth retrying; timeouts and provider errors are reported at once.
      if (!(err instanceof LlmError && err.kind === "invalid_output")) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new LlmError("invalid_output", "Model output invalid");
}
