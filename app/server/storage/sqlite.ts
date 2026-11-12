/**
 * SQLite implementation of Repository using Node's built-in node:sqlite module.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { countReport, type MeetingReport, type ReportDetail, type ReportStatus, type ReportSummary } from "../../shared/report.ts";
import type { ChatDetail, ChatMessage, ChatSummary, MessageKind, MessageMeta, MessageRole } from "../../shared/chat.ts";
import type { Task, TaskStatus } from "../../shared/tasks.ts";
import type { NewMessage, NewReport, NewTask, NewTranscript, Repository } from "./repository.ts";

interface TaskRow {
  id: string;
  created_at: string;
  title: string;
  due_date: string | null;
  remind_at: string | null;
  reminded_at: string | null;
  status: TaskStatus;
  chat_id: string | null;
}
const toTask = (r: TaskRow): Task => ({
  id: r.id,
  createdAt: r.created_at,
  title: r.title,
  dueDate: r.due_date,
  remindAt: r.remind_at,
  remindedAt: r.reminded_at,
  status: r.status,
  chatId: r.chat_id,
});
function parseMeta(json: string | null): MessageMeta | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as MessageMeta;
  } catch {
    return null;
  }
}

interface ChatRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
}
interface MessageRow {
  id: string;
  chat_id: string;
  created_at: string;
  role: MessageRole;
  kind: MessageKind;
  text: string;
  report_id: string | null;
  meta_json: string | null;
}
const toChat = (r: ChatRow): ChatSummary => ({ id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at });
const toMessage = (r: MessageRow): ChatMessage => ({
  id: r.id,
  chatId: r.chat_id,
  createdAt: r.created_at,
  role: r.role,
  kind: r.kind,
  text: r.text,
  reportId: r.report_id,
  meta: parseMeta(r.meta_json),
});

/** Strictly increasing ISO timestamps, so messages created in the same millisecond keep their order. */
let lastTs = 0;
function nowIso(): string {
  lastTs = Math.max(Date.now(), lastTs + 1);
  return new Date(lastTs).toISOString();
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transcripts (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  title       TEXT,
  content     TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'paste'
);
CREATE TABLE IF NOT EXISTS reports (
  id                TEXT PRIMARY KEY,
  transcript_id     TEXT NOT NULL REFERENCES transcripts(id),
  created_at        TEXT NOT NULL,
  title             TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('pending_review', 'failed')),
  content_json      TEXT,
  error_message     TEXT,
  model             TEXT NOT NULL,
  prompt_version    TEXT,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  total_tokens      INTEGER,
  cost_usd          REAL,
  duration_ms       INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE TABLE IF NOT EXISTS chats (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  title       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  chat_id     TEXT NOT NULL REFERENCES chats(id),
  created_at  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  kind        TEXT NOT NULL CHECK (kind IN ('text', 'transcript', 'meeting_report')),
  text        TEXT NOT NULL,
  report_id   TEXT REFERENCES reports(id)
);
CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  title        TEXT NOT NULL,
  due_date     TEXT,
  remind_at    TEXT,
  reminded_at  TEXT,
  status       TEXT NOT NULL CHECK (status IN ('open', 'done')),
  chat_id      TEXT REFERENCES chats(id)
);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
`;

interface ReportRow {
  id: string;
  transcript_id: string;
  created_at: string;
  title: string;
  status: ReportStatus;
  content_json: string | null;
  error_message: string | null;
  model: string;
  prompt_version: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  transcript: string;
}

function parseReport(json: string | null): MeetingReport | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as MeetingReport;
  } catch {
    return null;
  }
}

function toDetail(row: ReportRow): ReportDetail {
  return {
    id: row.id,
    transcriptId: row.transcript_id,
    createdAt: row.created_at,
    title: row.title,
    status: row.status,
    report: parseReport(row.content_json),
    errorMessage: row.error_message,
    model: row.model,
    promptVersion: row.prompt_version,
    usage: {
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      costUsd: row.cost_usd,
    },
    durationMs: row.duration_ms,
    transcript: row.transcript,
  };
}

export class SqliteRepository implements Repository {
  private readonly db: DatabaseSync;

  /** Pass ":memory:" for tests. */
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
    // Additive migration: message metadata (sources, created tasks) for assistant answers.
    const cols = this.db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "meta_json")) this.db.exec("ALTER TABLE messages ADD COLUMN meta_json TEXT");
  }

  createTranscript(input: NewTranscript): { id: string; createdAt: string } {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.db
      .prepare("INSERT INTO transcripts (id, created_at, title, content, source) VALUES (?, ?, ?, ?, ?)")
      .run(id, createdAt, input.title, input.content, input.source);
    return { id, createdAt };
  }

  createReport(input: NewReport): ReportDetail {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO reports (id, transcript_id, created_at, title, status, content_json, error_message, model,
          prompt_version, prompt_tokens, completion_tokens, total_tokens, cost_usd, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.transcriptId,
        createdAt,
        input.title,
        input.status,
        input.report ? JSON.stringify(input.report) : null,
        input.errorMessage,
        input.model,
        input.promptVersion,
        input.usage.promptTokens,
        input.usage.completionTokens,
        input.usage.totalTokens,
        input.usage.costUsd,
        input.durationMs,
      );
    const created = this.getReport(id);
    if (!created) throw new Error("Report was not stored");
    return created;
  }

  getReport(id: string): ReportDetail | null {
    const row = this.db
      .prepare(
        `SELECT r.*, t.content AS transcript FROM reports r JOIN transcripts t ON t.id = r.transcript_id WHERE r.id = ?`,
      )
      .get(id) as ReportRow | undefined;
    return row ? toDetail(row) : null;
  }

  listRecentReports(limit: number): ReportSummary[] {
    const rows = this.db
      .prepare(`SELECT id, created_at, title, status, content_json FROM reports ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as unknown as Pick<ReportRow, "id" | "created_at" | "title" | "status" | "content_json">[];
    return rows.map((row) => {
      const report = parseReport(row.content_json);
      return {
        id: row.id,
        createdAt: row.created_at,
        title: row.title,
        status: row.status,
        counts: report ? countReport(report) : null,
      };
    });
  }

  findReportIdByTranscript(content: string): string | null {
    const row = this.db
      .prepare(
        `SELECT r.id FROM reports r JOIN transcripts t ON t.id = r.transcript_id
         WHERE t.content = ? AND r.status = 'pending_review' ORDER BY r.created_at DESC LIMIT 1`,
      )
      .get(content) as { id: string } | undefined;
    return row?.id ?? null;
  }

  createChat(title: string): ChatSummary {
    const id = randomUUID();
    const ts = nowIso();
    this.db.prepare("INSERT INTO chats (id, created_at, updated_at, title) VALUES (?, ?, ?, ?)").run(id, ts, ts, title);
    return { id, title, createdAt: ts, updatedAt: ts };
  }

  renameChat(id: string, title: string): void {
    this.db.prepare("UPDATE chats SET title = ? WHERE id = ?").run(title, id);
  }

  getChat(id: string): ChatDetail | null {
    const row = this.db.prepare("SELECT * FROM chats WHERE id = ?").get(id) as ChatRow | undefined;
    if (!row) return null;
    const messages = this.db
      .prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC")
      .all(id) as unknown as MessageRow[];
    return { ...toChat(row), messages: messages.map(toMessage) };
  }

  listChats(limit: number): ChatSummary[] {
    const rows = this.db.prepare("SELECT * FROM chats ORDER BY updated_at DESC LIMIT ?").all(limit) as unknown as ChatRow[];
    return rows.map(toChat);
  }

  addMessage(input: NewMessage): ChatMessage {
    const id = randomUUID();
    const ts = nowIso();
    this.db
      .prepare(
        "INSERT INTO messages (id, chat_id, created_at, role, kind, text, report_id, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(id, input.chatId, ts, input.role, input.kind, input.text, input.reportId, input.meta ? JSON.stringify(input.meta) : null);
    this.db.prepare("UPDATE chats SET updated_at = ? WHERE id = ?").run(ts, input.chatId);
    return {
      id,
      chatId: input.chatId,
      createdAt: ts,
      role: input.role,
      kind: input.kind,
      text: input.text,
      reportId: input.reportId,
      meta: input.meta ?? null,
    };
  }

  createTask(input: NewTask): Task {
    const id = randomUUID();
    const ts = nowIso();
    this.db
      .prepare("INSERT INTO tasks (id, created_at, title, due_date, remind_at, reminded_at, status, chat_id) VALUES (?, ?, ?, ?, ?, NULL, 'open', ?)")
      .run(id, ts, input.title, input.dueDate, input.remindAt, input.chatId);
    return this.getTask(id)!;
  }

  getTask(id: string): Task | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
    return row ? toTask(row) : null;
  }

  listTasks(): Task[] {
    const rows = this.db
      .prepare("SELECT * FROM tasks ORDER BY status ASC, COALESCE(due_date, remind_at, '9999') ASC, created_at DESC")
      .all() as unknown as TaskRow[];
    return rows.map(toTask);
  }

  updateTask(id: string, patch: { status?: TaskStatus; remindedAt?: string }): Task | null {
    if (patch.status) this.db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(patch.status, id);
    if (patch.remindedAt) this.db.prepare("UPDATE tasks SET reminded_at = ? WHERE id = ?").run(patch.remindedAt, id);
    return this.getTask(id);
  }

  close(): void {
    this.db.close();
  }
}
