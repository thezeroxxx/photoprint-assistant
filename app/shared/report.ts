/**
 * Meeting report contract shared by the server and the client.
 *
 * Two shapes exist on purpose:
 *  - ModelReportSchema: exactly what the AI model must return (sent to the model as a JSON schema
 *    and used to validate its answer).
 *  - MeetingReport: what the application stores and displays, after the server has verified every
 *    evidence quote against the transcript (see server/analysis/evidence.ts).
 */
import { z } from "zod";

export const MISSING_KINDS = ["owner", "deadline", "agreement", "other"] as const;
export type MissingKind = (typeof MISSING_KINDS)[number];

const text = z.string().min(1);

export const ModelReportSchema = z.strictObject({
  meeting_title: z
    .string()
    .describe("Короткое название встречи по её содержанию (3–8 слов), на русском языке."),
  summary: text.describe("Краткое резюме встречи: 2–5 предложений, только факты из расшифровки."),
  decisions: z
    .array(z.strictObject({ text: text.describe("Решение, явно принятое на встрече.") }))
    .describe("Ключевые решения. Пустой массив, если явных решений не было."),
  commitments: z
    .array(
      z.strictObject({
        action: text.describe("Что именно участник взялся сделать."),
        owner: text.describe("Кто взял обязательство — имя или роль, как в расшифровке."),
        deadline: z
          .string()
          .nullable()
          .describe("Срок, только если он прямо назван в расшифровке; иначе null."),
        evidence_quote: z
          .string()
          .nullable()
          .describe("Дословная короткая цитата из расшифровки, подтверждающая обязательство; null, если её нет."),
      }),
    )
    .describe("Только явно принятые обязательства с понятным ответственным."),
  needs_clarification: z
    .array(
      z.strictObject({
        statement: text.describe("Расплывчатое намерение или потенциальное обязательство."),
        missing: z
          .array(z.enum(MISSING_KINDS))
          .min(1)
          .describe("Чего не хватает: owner — ответственного, deadline — срока, agreement — подтверждения согласия, other — иного."),
        missing_note: z
          .string()
          .nullable()
          .describe("Короткое пояснение, чего именно не хватает; null, если всё ясно из поля missing."),
        evidence_quote: z
          .string()
          .nullable()
          .describe("Дословная короткая цитата из расшифровки; null, если её нет."),
      }),
    )
    .describe("Пункты, которые нельзя считать подтверждёнными обязательствами."),
  open_questions: z
    .array(z.strictObject({ text: text.describe("Нерешённый вопрос, разногласие или проблема.") }))
    .describe("Открытые вопросы и нерешённые проблемы."),
  suggested_next_steps: z
    .array(z.strictObject({ text: text.describe("Рекомендация ассистента (не поручение).") }))
    .describe("Рекомендации ИИ по дальнейшим шагам. Это предложения, а не назначенные задачи."),
});

export type ModelReport = z.infer<typeof ModelReportSchema>;

/** Result of checking a quote against the transcript. */
export type EvidenceStatus = "verified" | "unavailable";

export interface Commitment {
  action: string;
  owner: string;
  /** null means the deadline was not explicitly stated ("Не указан"). */
  deadline: string | null;
  /** Only present when the quote was found verbatim in the transcript. */
  evidence_quote: string | null;
  evidence_status: EvidenceStatus;
}

export interface ClarificationItem {
  statement: string;
  missing: MissingKind[];
  missing_note: string | null;
  evidence_quote: string | null;
  evidence_status: EvidenceStatus;
}

export interface MeetingReport {
  meeting_title: string;
  summary: string;
  decisions: { text: string }[];
  commitments: Commitment[];
  needs_clarification: ClarificationItem[];
  open_questions: { text: string }[];
  suggested_next_steps: { text: string }[];
}

export type ReportStatus = "pending_review" | "failed";

export interface UsageInfo {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
}

/** Full report as returned by GET /api/analyses/:id and POST /api/analyses. */
export interface ReportDetail {
  id: string;
  transcriptId: string;
  createdAt: string;
  title: string;
  status: ReportStatus;
  report: MeetingReport | null;
  errorMessage: string | null;
  model: string;
  promptVersion: string | null;
  usage: UsageInfo;
  durationMs: number | null;
  transcript: string;
}

export interface ReportCounts {
  decisions: number;
  commitments: number;
  clarifications: number;
  openQuestions: number;
}

/** Item of GET /api/analyses (recent reports list). */
export interface ReportSummary {
  id: string;
  createdAt: string;
  title: string;
  status: ReportStatus;
  counts: ReportCounts | null;
}

export function countReport(report: MeetingReport): ReportCounts {
  return {
    decisions: report.decisions.length,
    commitments: report.commitments.length,
    clarifications: report.needs_clarification.length,
    openQuestions: report.open_questions.length,
  };
}

/** Error body returned by the API. */
export interface ApiError {
  error: { code: string; message: string };
}
