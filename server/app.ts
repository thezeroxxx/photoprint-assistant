/**
 * Express application (routes, validation, error handling). Built from injected dependencies
 * so it can be tested with an in-memory repository and a fake model.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import type { ApiError } from "../shared/report.ts";
import { analyzeMeeting } from "./analysis/analyzeMeeting.ts";
import { LlmError, type LlmClient } from "./llm/types.ts";
import type { Repository } from "./storage/repository.ts";

export interface AppDeps {
  repo: Repository;
  llm: LlmClient;
  limits: { minTranscriptChars: number; maxTranscriptChars: number };
  /** Directory with the built client (served in production), if any. */
  staticDir?: string;
  log?: (msg: string) => void;
}

const RECENT_LIMIT = 10;

function sendError(res: Response, status: number, code: string, message: string) {
  const body: ApiError = { error: { code, message } };
  res.status(status).json(body);
}

/** Maps model errors to an HTTP status and a Russian message for the user. */
function describeLlmError(err: LlmError): { status: number; code: string; message: string } {
  switch (err.kind) {
    case "not_configured":
      return { status: 503, code: "not_configured", message: "Анализ недоступен: не настроен ключ доступа к модели ИИ." };
    case "timeout":
      return { status: 504, code: "timeout", message: "Модель ИИ не ответила вовремя. Попробуйте ещё раз." };
    case "invalid_output":
      return { status: 502, code: "invalid_output", message: "Модель ИИ вернула некорректный ответ. Попробуйте ещё раз." };
    case "upstream":
    default:
      if (err.status === 401 || err.status === 403)
        return { status: 502, code: "auth", message: "Сервис ИИ отклонил запрос: проверьте ключ доступа или VPN." };
      if (err.status === 402)
        return { status: 502, code: "credits", message: "На счёте сервиса ИИ недостаточно средств." };
      if (err.status === 429)
        return { status: 502, code: "rate_limited", message: "Сервис ИИ временно перегружен. Попробуйте через минуту." };
      return { status: 502, code: "upstream", message: "Сервис ИИ временно недоступен. Попробуйте ещё раз." };
  }
}

export function createApp(deps: AppDeps) {
  const { repo, llm, limits } = deps;
  const log = deps.log ?? ((m: string) => console.log(m));
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  const AnalysisInput = z.object({
    title: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : null)),
    transcript: z.string().trim().min(limits.minTranscriptChars).max(limits.maxTranscriptChars),
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, model: llm.model });
  });

  app.post("/api/analyses", async (req: Request, res: Response) => {
    const input = AnalysisInput.safeParse(req.body);
    if (!input.success) {
      const length = typeof req.body?.transcript === "string" ? req.body.transcript.trim().length : 0;
      const message =
        length < limits.minTranscriptChars
          ? `Расшифровка слишком короткая: нужно не меньше ${limits.minTranscriptChars} символов.`
          : length > limits.maxTranscriptChars
            ? `Расшифровка слишком длинная: максимум ${limits.maxTranscriptChars} символов.`
            : "Проверьте введённые данные.";
      return sendError(res, 400, "invalid_input", message);
    }
    const { title, transcript } = input.data;
    const stored = repo.createTranscript({ title, content: transcript, source: "paste" });

    try {
      const result = await analyzeMeeting(llm, transcript, title);
      const detail = repo.createReport({
        transcriptId: stored.id,
        status: "pending_review",
        title: title ?? result.report.meeting_title,
        report: result.report,
        errorMessage: null,
        model: result.model,
        promptVersion: result.promptVersion,
        usage: result.usage,
        durationMs: result.durationMs,
      });
      log(
        `[analysis] ok model=${result.model} attempts=${result.attempts} tokens=${result.usage.totalTokens ?? "?"} ` +
          `cost=${result.usage.costUsd ?? "?"} ms=${result.durationMs}`,
      );
      return res.status(201).json(detail);
    } catch (err) {
      const llmErr = err instanceof LlmError ? err : null;
      const mapped = llmErr
        ? describeLlmError(llmErr)
        : { status: 500, code: "internal", message: "Внутренняя ошибка. Попробуйте ещё раз." };
      repo.createReport({
        transcriptId: stored.id,
        status: "failed",
        title: title ?? "Встреча без названия",
        report: null,
        errorMessage: (err as Error).message,
        model: llm.model,
        promptVersion: null,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null, costUsd: null },
        durationMs: null,
      });
      log(`[analysis] failed (${mapped.code}): ${(err as Error).message}`);
      return sendError(res, mapped.status, mapped.code, mapped.message);
    }
  });

  app.get("/api/analyses", (_req, res) => {
    res.json(repo.listRecentReports(RECENT_LIMIT));
  });

  app.get("/api/analyses/:id", (req, res) => {
    const detail = repo.getReport(req.params.id);
    if (!detail) return sendError(res, 404, "not_found", "Отчёт не найден.");
    res.json(detail);
  });

  app.use("/api", (_req, res) => sendError(res, 404, "not_found", "Не найдено."));

  if (deps.staticDir && existsSync(deps.staticDir)) {
    const dir = resolve(deps.staticDir);
    app.use(express.static(dir));
    app.get("/{*splat}", (_req, res) => res.sendFile(resolve(dir, "index.html")));
  }

  // Malformed JSON bodies and any unexpected error.
  app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === "entity.parse.failed") return sendError(res, 400, "invalid_json", "Некорректный запрос.");
    if (err.type === "entity.too.large") return sendError(res, 413, "too_large", "Слишком большой запрос.");
    log(`[error] ${err.message}`);
    sendError(res, 500, "internal", "Внутренняя ошибка.");
  });

  return app;
}
