import type { MeetingReport, MissingKind, ReportDetail } from "../../../shared/report.ts";
import { formatDateTime } from "./format.ts";

export const MISSING_LABELS: Record<MissingKind, string> = {
  owner: "Ответственный",
  deadline: "Срок",
  agreement: "Подтверждение",
  other: "Детали",
};

export const NO_DEADLINE = "Срок не указан";

/** Plain-text version of the report for "Копировать отчёт". Keeps the six sections in order. */
export function reportToText(detail: ReportDetail, report: MeetingReport): string {
  const lines: string[] = [];
  lines.push(detail.title, formatDateTime(detail.createdAt) + " · Ожидает проверки", "");
  lines.push("1. Резюме", report.summary, "");
  lines.push("2. Ключевые решения");
  lines.push(...(report.decisions.length ? report.decisions.map((d) => `• ${d.text}`) : ["— нет"]), "");
  lines.push("3. Подтверждённые обязательства");
  lines.push(
    ...(report.commitments.length
      ? report.commitments.map((c) => `• ${c.action} — ${c.owner}; ${c.deadline ? `срок: ${c.deadline}` : NO_DEADLINE.toLowerCase()}`)
      : ["— нет"]),
    "",
  );
  if (report.needs_clarification.length) {
    lines.push("4. Требуют уточнения");
    lines.push(
      ...report.needs_clarification.map(
        (n) => `• ${n.statement} (не хватает: ${n.missing.map((m) => MISSING_LABELS[m].toLowerCase()).join(", ")})`,
      ),
      "",
    );
  }
  lines.push("5. Открытые вопросы");
  lines.push(...(report.open_questions.length ? report.open_questions.map((q) => `• ${q.text}`) : ["— нет"]), "");
  lines.push("6. Предлагаемые шаги (предложения ИИ, не поручения)");
  lines.push(...report.suggested_next_steps.map((s) => `• ${s.text}`));
  return lines.join("\n");
}
