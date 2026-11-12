/**
 * SQLite implementation of Repository using Node's built-in node:sqlite module.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { countReport, type MeetingReport, type ReportDetail, type ReportStatus, type ReportSummary } from "../../shared/report.ts";
import type { NewReport, NewTranscript, Repository } from "./repository.ts";

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

  close(): void {
    this.db.close();
  }
}
