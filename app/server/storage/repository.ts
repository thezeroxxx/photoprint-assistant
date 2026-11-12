/**
 * Storage boundary. Application logic depends only on this interface, so the SQLite
 * implementation can be replaced (e.g. by another database or a corporate system)
 * without changing the business logic.
 */
import type { ChatDetail, ChatMessage, ChatSummary, MessageKind, MessageMeta, MessageRole } from "../../shared/chat.ts";
import type { Task, TaskStatus } from "../../shared/tasks.ts";
import type { MeetingReport, ReportDetail, ReportStatus, ReportSummary, UsageInfo } from "../../shared/report.ts";

export interface NewTranscript {
  title: string | null;
  content: string;
  source: "paste";
}

export interface NewReport {
  transcriptId: string;
  status: ReportStatus;
  title: string;
  report: MeetingReport | null;
  errorMessage: string | null;
  model: string;
  promptVersion: string | null;
  usage: UsageInfo;
  durationMs: number | null;
}

export interface NewMessage {
  chatId: string;
  role: MessageRole;
  kind: MessageKind;
  text: string;
  reportId: string | null;
  meta?: MessageMeta | null;
}

export interface NewTask {
  title: string;
  dueDate: string | null;
  remindAt: string | null;
  chatId: string | null;
}

export interface Repository {
  createTranscript(input: NewTranscript): { id: string; createdAt: string };
  createReport(input: NewReport): ReportDetail;
  getReport(id: string): ReportDetail | null;
  listRecentReports(limit: number): ReportSummary[];
  /** Id of a successful report for exactly this transcript text, if one exists (used to keep demo seeding idempotent). */
  findReportIdByTranscript(content: string): string | null;

  createChat(title: string): ChatSummary;
  renameChat(id: string, title: string): void;
  getChat(id: string): ChatDetail | null;
  listChats(limit: number): ChatSummary[];
  /** Adds a message and marks the chat as updated. */
  addMessage(input: NewMessage): ChatMessage;

  createTask(input: NewTask): Task;
  getTask(id: string): Task | null;
  listTasks(): Task[];
  updateTask(id: string, patch: { status?: TaskStatus; remindedAt?: string }): Task | null;

  close(): void;
}
