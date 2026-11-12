/**
 * Storage boundary. Application logic depends only on this interface, so the SQLite
 * implementation can be replaced (e.g. by another database or a corporate system)
 * without changing the business logic.
 */
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

export interface Repository {
  createTranscript(input: NewTranscript): { id: string; createdAt: string };
  createReport(input: NewReport): ReportDetail;
  getReport(id: string): ReportDetail | null;
  listRecentReports(limit: number): ReportSummary[];
  close(): void;
}
