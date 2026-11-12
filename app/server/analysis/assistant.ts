/**
 * The assistant's chat turn: answers from stored meetings and tasks, and decides on actions
 * (create a task/reminder, complete a task). Depends only on the LlmClient and Repository interfaces.
 *
 * Grounding: all meeting reports and tasks are given to the model as numbered records (M1…, T1…).
 * The model must cite the meetings it used; the server keeps only citations that exist.
 * Actions are validated by the server before anything is stored.
 */
import { z } from "zod";
import type { ChatMessage, MessageMeta, SourceRef } from "../../shared/chat.ts";
import type { ReportDetail } from "../../shared/report.ts";
import type { Task } from "../../shared/tasks.ts";
import { LlmError, type LlmClient } from "../llm/types.ts";
import type { Repository } from "../storage/repository.ts";

export const ASSISTANT_PROMPT_VERSION = "assistant-v2";
const MAX_MEETINGS = 30;
const HISTORY_LIMIT = 12;

const AssistantTurnSchema = z.strictObject({
  reply: z.string().min(1).describe("Ответ пользователю на русском языке, обычным текстом."),
  chat_title: z.string().describe("Короткое название чата по теме (2–6 слов)."),
  sources: z.array(z.string()).describe("Метки встреч (M1, M2…), на которых основан ответ. Пусто, если данные встреч не использовались."),
  actions: z
    .array(
      z.strictObject({
        type: z.enum(["create_task", "complete_task"]),
        title: z.string().nullable().describe("Для create_task: формулировка задачи."),
        due_date: z.string().nullable().describe("Для create_task: срок в формате YYYY-MM-DD или null."),
        remind_at: z.string().nullable().describe("Для create_task: время напоминания YYYY-MM-DDTHH:MM или null."),
        task_ref: z.string().nullable().describe("Для complete_task: метка задачи (T1, T2…)."),
      }),
    )
    .describe("Действия, которые нужно выполнить. Пусто, если пользователь ничего не просил сделать."),
});
type AssistantTurn = z.infer<typeof AssistantTurnSchema>;

const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today and the next 13 days with weekdays, so relative dates ("в пятницу") resolve correctly. */
export function calendarContext(now: Date): string {
  const lines = [`Сейчас: ${WEEKDAYS[now.getDay()]}, ${isoDate(now)}, ${pad(now.getHours())}:${pad(now.getMinutes())} (местное время).`];
  lines.push("Ближайшие дни:");
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    lines.push(`• ${isoDate(d)} — ${WEEKDAYS[d.getDay()]}${i === 0 ? " (сегодня)" : i === 1 ? " (завтра)" : ""}`);
  }
  return lines.join("\n");
}

export interface DataContext {
  text: string;
  meetingRefs: Map<string, ReportDetail>;
  taskRefs: Map<string, Task>;
}

/** Builds the numbered records the model answers from. */
export function buildDataContext(reports: ReportDetail[], tasks: Task[]): DataContext {
  const meetingRefs = new Map<string, ReportDetail>();
  const taskRefs = new Map<string, Task>();
  const parts: string[] = [];

  const usable = reports.filter((r) => r.status === "pending_review" && r.report).slice(0, MAX_MEETINGS);
  parts.push(usable.length ? "ВСТРЕЧИ (данные извлечены ИИ и ещё не проверены руководителем):" : "ВСТРЕЧИ: нет сохранённых встреч.");
  usable.forEach((r, i) => {
    const ref = `M${i + 1}`;
    meetingRefs.set(ref, r);
    const rep = r.report!;
    const lines = [`[${ref}] «${r.title}», дата анализа: ${r.createdAt.slice(0, 10)}`, `Резюме: ${rep.summary}`];
    if (rep.decisions.length) lines.push(`Решения: ${rep.decisions.map((d) => d.text).join(" | ")}`);
    if (rep.commitments.length)
      lines.push(`Обязательства: ${rep.commitments.map((c) => `${c.owner} — ${c.action} (срок: ${c.deadline ?? "не указан"})`).join(" | ")}`);
    if (rep.needs_clarification.length)
      lines.push(`Требуют уточнения: ${rep.needs_clarification.map((n) => `${n.statement} (не хватает: ${n.missing.join(", ")})`).join(" | ")}`);
    if (rep.open_questions.length) lines.push(`Открытые вопросы: ${rep.open_questions.map((q) => q.text).join(" | ")}`);
    parts.push(lines.join("\n"));
  });

  parts.push(tasks.length ? "\nЗАДАЧИ РУКОВОДИТЕЛЯ:" : "\nЗАДАЧИ РУКОВОДИТЕЛЯ: нет задач.");
  tasks.forEach((t, i) => {
    const ref = `T${i + 1}`;
    taskRefs.set(ref, t);
    parts.push(
      `[${ref}] ${t.title}; статус: ${t.status === "done" ? "выполнена" : "открыта"}; срок: ${t.dueDate ?? "нет"}; напоминание: ${t.remindAt ?? "нет"}`,
    );
  });
  return { text: parts.join("\n\n"), meetingRefs, taskRefs };
}

const SYSTEM = `Ты — ИИ-ассистент генерального директора производственной компании Photoprint. Отвечай по-русски, коротко и по делу, обычным текстом без Markdown (списки — через «•»).

У тебя есть доступ к данным (ниже): разобранные встречи [M…] и задачи руководителя [T…].

Как отвечать на вопросы:
• Отвечай ТОЛЬКО по этим данным, когда вопрос о встречах, людях, решениях, обязательствах, сроках или задачах. Называй встречу, где это прозвучало.
• В поле sources перечисли метки встреч, на которых основан ответ.
• В тексте reply НИКОГДА не пиши служебные метки (M1, T2 и т. п.) — пользователь их не видит. Называй встречу словами, например «на совещании по бюджету».
• Если в данных нет ответа — прямо скажи, что в сохранённых встречах этого нет. Ничего не выдумывай.
• Данные встреч извлечены ИИ и не проверены руководителем — если это важно для ответа, упомяни.
• Сроки в обязательствах — как они прозвучали на встрече («до пятницы»); не пересчитывай их в даты, если не уверен.

Действия (поле actions):
• create_task — когда пользователь просит что-то запомнить, напомнить, добавить задачу или поставить напоминание. Даты считай по календарю ниже. Если время напоминания не названо — ставь 09:00 того дня. «Напомни в пятницу» → remind_at = ближайшая пятница 09:00, due_date = та же дата.
• complete_task — когда пользователь говорит, что задача выполнена; укажи task_ref.
• Если пользователь ничего не просил сделать — actions пустой.
• В reply подтверди, что именно сделано (например: «Готово: напомню в пятницу, 13 ноября, в 09:00 — позвонить поставщику»).
• Ты НЕ умеешь: отправлять письма и сообщения людям, работать с календарём, звонить. Если просят — честно скажи и предложи создать задачу-напоминание или черновик текста.

Общие вопросы (формулировки, черновики писем, советы) решай как обычный помощник.`;

/** Validates model actions and applies the valid ones. Invalid actions are skipped, never guessed. */
export function applyActions(
  repo: Repository,
  turn: AssistantTurn,
  ctx: DataContext,
  chatId: string,
): Pick<MessageMeta, "createdTasks" | "completedTasks"> {
  const createdTasks: Task[] = [];
  const completedTasks: Task[] = [];
  const validDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
  const validDateTime = (v: string | null) =>
    v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null;

  for (const a of turn.actions) {
    if (a.type === "create_task") {
      const title = a.title?.trim();
      if (!title) continue;
      const remindAt = validDateTime(a.remind_at);
      const dueDate = validDate(a.due_date) ?? (remindAt ? remindAt.slice(0, 10) : null);
      createdTasks.push(repo.createTask({ title, dueDate, remindAt, chatId }));
    } else if (a.type === "complete_task" && a.task_ref) {
      const task = ctx.taskRefs.get(a.task_ref.trim());
      if (!task || task.status === "done") continue;
      const updated = repo.updateTask(task.id, { status: "done" });
      if (updated) completedTasks.push(updated);
    }
  }
  return {
    ...(createdTasks.length ? { createdTasks } : {}),
    ...(completedTasks.length ? { completedTasks } : {}),
  };
}

/** Safety net: removes internal record labels like "(M1)", "(M6–M9)", "[T2]" if the model still writes them. */
export function stripRefs(text: string): string {
  return text
    .replace(/\s*[([]\s*[MT]\d+(?:\s*[–—,-]\s*[MT]?\d+)*\s*[)\]]/g, "")
    .replace(/\b[MT]\d+\b/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/ +([.,;:!?])/g, "$1")
    .trim();
}

export interface AssistantResult {
  reply: string;
  title: string;
  meta: MessageMeta;
}

/** One assistant turn over the stored data. Pass `now` for deterministic tests. */
export async function runAssistantTurn(
  llm: LlmClient,
  repo: Repository,
  history: ChatMessage[],
  userText: string,
  chatIdForTasks: () => string,
  now = new Date(),
): Promise<AssistantResult> {
  const reports = repo
    .listRecentReports(MAX_MEETINGS)
    .map((s) => repo.getReport(s.id))
    .filter((r): r is ReportDetail => r !== null);
  const ctx = buildDataContext(reports, repo.listTasks());

  const line = (m: ChatMessage) =>
    m.kind === "transcript" ? "[прислал расшифровку встречи]" : m.kind === "meeting_report" ? `[подготовил отчёт: ${m.text}]` : m.text;
  const recent = history.slice(-HISTORY_LIMIT).map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${line(m)}`);

  const user = [
    calendarContext(now),
    "ДАННЫЕ:\n" + ctx.text,
    recent.length ? `ИСТОРИЯ ЧАТА:\n${recent.join("\n")}` : "",
    `НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:\n${userText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await llm.generateStructured({
    system: SYSTEM,
    user,
    schemaName: "assistant_turn",
    jsonSchema: z.toJSONSchema(AssistantTurnSchema, { target: "draft-7" }) as Record<string, unknown>,
  });
  const parsed = AssistantTurnSchema.safeParse(res.data);
  if (!parsed.success) throw new LlmError("invalid_output", "Assistant turn failed validation");
  const turn = parsed.data;

  // Keep only citations that point to real meetings.
  const sources: SourceRef[] = [];
  for (const ref of new Set(turn.sources.map((s) => s.trim()))) {
    const r = ctx.meetingRefs.get(ref);
    if (r) sources.push({ reportId: r.id, title: r.title, createdAt: r.createdAt });
  }
  const actions = turn.actions.length ? applyActions(repo, turn, ctx, chatIdForTasks()) : {};
  return {
    reply: stripRefs(turn.reply),
    title: turn.chat_title.trim(),
    meta: { ...(sources.length ? { sources } : {}), ...actions },
  };
}
