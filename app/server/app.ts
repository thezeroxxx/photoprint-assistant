/**
 * Express application (routes, validation, error handling). Built from injected dependencies
 * so it can be tested with an in-memory repository and a fake model.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import type { ApiError, ReportDetail } from "../shared/report.ts";
import type { ChatMessage, SendMessageResponse } from "../shared/chat.ts";
import type { MeetingCommitment } from "../shared/tasks.ts";
import { analyzeMeeting } from "./analysis/analyzeMeeting.ts";
import { runAssistantTurn } from "./analysis/assistant.ts";
import { looksLikeTranscript, titleFromText } from "./analysis/chat.ts";
import { LlmError, type LlmClient } from "./llm/types.ts";
import type { Repository } from "./storage/repository.ts";
import { formatFromContentType, type SpeechToText } from "./stt/types.ts";

export interface AppDeps {
  repo: Repository;
  llm: LlmClient;
  stt: SpeechToText;
  /** Upload limit for voice messages, in megabytes. */
  maxAudioMb?: number;
  limits: { minTranscriptChars: number; maxTranscriptChars: number };
  /** Directory with the built client (served in production), if any. */
  staticDir?: string;
  log?: (msg: string) => void;
}

const RECENT_LIMIT = 10;
const CHAT_LIST_LIMIT = 50;

function mapError(err: unknown): { status: number; code: string; message: string } {
  return err instanceof LlmError
    ? describeLlmError(err)
    : { status: 500, code: "internal", message: "Внутренняя ошибка. Попробуйте ещё раз." };
}

/** Raw technical error text stays in the database and server log; it is never sent to the browser. */
const toPublic = (detail: ReportDetail): ReportDetail => ({ ...detail, errorMessage: null });

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

  /** Analyzes a transcript and stores the result (failed attempts are stored too). */
  async function runAnalysis(
    title: string | null,
    transcript: string,
  ): Promise<{ ok: true; detail: ReportDetail } | { ok: false; status: number; code: string; message: string }> {
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
      return { ok: true, detail };
    } catch (err) {
      const mapped = mapError(err);
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
      return { ok: false, ...mapped };
    }
  }

  const transcriptLengthMessage = (length: number) =>
    length < limits.minTranscriptChars
      ? `Расшифровка слишком короткая: нужно не меньше ${limits.minTranscriptChars} символов.`
      : `Расшифровка слишком длинная: максимум ${limits.maxTranscriptChars} символов.`;

  app.post("/api/analyses", async (req: Request, res: Response) => {
    const input = AnalysisInput.safeParse(req.body);
    if (!input.success) {
      const length = typeof req.body?.transcript === "string" ? req.body.transcript.trim().length : 0;
      const message =
        length < limits.minTranscriptChars || length > limits.maxTranscriptChars
          ? transcriptLengthMessage(length)
          : "Проверьте введённые данные.";
      return sendError(res, 400, "invalid_input", message);
    }
    const result = await runAnalysis(input.data.title, input.data.transcript);
    if (!result.ok) return sendError(res, result.status, result.code, result.message);
    return res.status(201).json(toPublic(result.detail));
  });

  // ---------- Voice (speech-to-text) ----------
  /** Receives a raw audio recording (Content-Type audio/*) and returns the recognized text. Nothing is stored. */
  app.post(
    "/api/transcribe",
    express.raw({ type: () => true, limit: `${deps.maxAudioMb ?? 10}mb` }),
    async (req: Request, res: Response) => {
      const format = formatFromContentType(req.headers["content-type"]);
      if (!format) return sendError(res, 415, "unsupported_audio", "Этот формат аудио не поддерживается.");
      const audio = req.body as Buffer;
      if (!Buffer.isBuffer(audio) || audio.length < 1000) {
        return sendError(res, 400, "empty_audio", "Запись слишком короткая. Попробуйте ещё раз.");
      }
      try {
        const result = await deps.stt.transcribe(audio, format);
        log(`[stt] ok model=${result.model} bytes=${audio.length} ms=${result.durationMs}`);
        if (!result.text) return sendError(res, 422, "no_speech", "Не удалось распознать речь. Попробуйте ещё раз.");
        return res.json({ text: result.text });
      } catch (err) {
        const mapped = mapError(err);
        log(`[stt] failed (${mapped.code}): ${(err as Error).message}`);
        return sendError(res, mapped.status, mapped.code, mapped.message.replace("Модель ИИ", "Сервис распознавания речи"));
      }
    },
  );

  // ---------- Chats ----------
  const ChatInput = z.object({
    chatId: z.string().trim().min(1).max(100).optional(),
    text: z.string().trim().min(1).max(limits.maxTranscriptChars),
    mode: z.enum(["auto", "transcript"]).default("auto"),
  });

  app.get("/api/chats", (_req, res) => {
    res.json(repo.listChats(CHAT_LIST_LIMIT));
  });

  app.get("/api/chats/:id", (req, res) => {
    const chat = repo.getChat(req.params.id);
    if (!chat) return sendError(res, 404, "not_found", "Чат не найден.");
    res.json(chat);
  });

  /**
   * Sends a message. A transcript (attach button, or a long "Speaker: text" paste) is analyzed
   * and answered with a meeting-report card; anything else gets a plain assistant reply.
   * Messages are stored only after a successful answer, so a retry never duplicates them.
   */
  app.post("/api/chat", async (req: Request, res: Response) => {
    const input = ChatInput.safeParse(req.body);
    if (!input.success) {
      const length = typeof req.body?.text === "string" ? req.body.text.trim().length : 0;
      return sendError(
        res,
        400,
        "invalid_input",
        length === 0 ? "Напишите сообщение." : `Сообщение слишком длинное: максимум ${limits.maxTranscriptChars} символов.`,
      );
    }
    const { chatId, text, mode } = input.data;
    const existing = chatId ? repo.getChat(chatId) : null;
    if (chatId && !existing) return sendError(res, 404, "not_found", "Чат не найден.");

    const isTranscript = mode === "transcript" || looksLikeTranscript(text);
    if (isTranscript) {
      if (text.length < limits.minTranscriptChars) return sendError(res, 400, "invalid_input", transcriptLengthMessage(text.length));
      const result = await runAnalysis(null, text);
      if (!result.ok) return sendError(res, result.status, result.code, result.message);
      const chat = existing ?? repo.createChat(result.detail.title);
      if (existing && existing.messages.length === 0) repo.renameChat(chat.id, result.detail.title);
      const added = [
        repo.addMessage({ chatId: chat.id, role: "user", kind: "transcript", text, reportId: null }),
        repo.addMessage({
          chatId: chat.id,
          role: "assistant",
          kind: "meeting_report",
          text: `Разобрал встречу «${result.detail.title}».`,
          reportId: result.detail.id,
        }),
      ];
      return res.status(201).json(chatResponse(chat.id, added));
    }

    try {
      // A task created in a brand-new chat needs the chat to exist first.
      let chat = existing ? { id: existing.id } : null;
      let createdEarly = false;
      const chatIdForTasks = () => {
        if (!chat) {
          chat = repo.createChat(titleFromText(text));
          createdEarly = true;
        }
        return chat.id;
      };
      const result = await runAssistantTurn(llm, repo, existing?.messages ?? [], text, chatIdForTasks);
      const title = result.title || titleFromText(text);
      if (!chat) chat = repo.createChat(title);
      else if (createdEarly) repo.renameChat(chat.id, title);
      const chatId = chat.id;
      const added = [
        repo.addMessage({ chatId, role: "user", kind: "text", text, reportId: null }),
        repo.addMessage({
          chatId,
          role: "assistant",
          kind: "text",
          text: result.reply,
          reportId: null,
          meta: Object.keys(result.meta).length ? result.meta : null,
        }),
      ];
      log(
        `[chat] ok chat=${chatId.slice(0, 8)} sources=${result.meta.sources?.length ?? 0} ` +
          `tasks+=${result.meta.createdTasks?.length ?? 0} done=${result.meta.completedTasks?.length ?? 0}`,
      );
      return res.status(201).json(chatResponse(chatId, added));
    } catch (err) {
      const mapped = mapError(err);
      log(`[chat] failed (${mapped.code}): ${(err as Error).message}`);
      return sendError(res, mapped.status, mapped.code, mapped.message);
    }
  });

  // ---------- Tasks and commitments ----------
  app.get("/api/tasks", (_req, res) => {
    res.json(repo.listTasks());
  });

  const TaskPatch = z.object({ status: z.enum(["open", "done"]).optional(), reminded: z.boolean().optional() });
  app.patch("/api/tasks/:id", (req, res) => {
    const patch = TaskPatch.safeParse(req.body);
    if (!patch.success) return sendError(res, 400, "invalid_input", "Проверьте введённые данные.");
    if (!repo.getTask(req.params.id)) return sendError(res, 404, "not_found", "Задача не найдена.");
    const updated = repo.updateTask(req.params.id, {
      status: patch.data.status,
      remindedAt: patch.data.reminded ? new Date().toISOString() : undefined,
    });
    res.json(updated);
  });

  /** All commitments extracted from meeting reports (AI-extracted, not reviewed). */
  app.get("/api/commitments", (_req, res) => {
    const out: MeetingCommitment[] = [];
    for (const s of repo.listRecentReports(200)) {
      const d = repo.getReport(s.id);
      if (!d?.report) continue;
      for (const c of d.report.commitments) {
        out.push({ reportId: d.id, meetingTitle: d.title, meetingDate: d.createdAt, action: c.action, owner: c.owner, deadline: c.deadline });
      }
    }
    res.json(out);
  });

  function chatResponse(chatId: string, added: ChatMessage[]): SendMessageResponse {
    const chat = repo.getChat(chatId)!;
    const { messages: _messages, ...summary } = chat;
    return { chat: summary, added };
  }

  app.get("/api/analyses", (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || RECENT_LIMIT, 1), 200);
    res.json(repo.listRecentReports(limit));
  });

  app.get("/api/analyses/:id", (req, res) => {
    const detail = repo.getReport(req.params.id);
    if (!detail) return sendError(res, 404, "not_found", "Отчёт не найден.");
    res.json(toPublic(detail));
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
