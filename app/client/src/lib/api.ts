import type { ChatDetail, ChatSummary, SendMessageRequest, SendMessageResponse } from "../../../shared/chat.ts";
import type { ApiError, ReportDetail, ReportSummary } from "../../../shared/report.ts";
import type { MeetingCommitment, Task, UpdateTaskRequest } from "../../../shared/tasks.ts";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiRequestError(0, "network", "Нет связи с сервером. Проверьте, что приложение запущено.");
  }
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = (body as ApiError | null)?.error;
    throw new ApiRequestError(res.status, err?.code ?? "unknown", err?.message ?? "Что-то пошло не так. Попробуйте ещё раз.");
  }
  return body as T;
}

export const api = {
  analyze: (transcript: string, title: string) =>
    request<ReportDetail>("/api/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, title: title.trim() || undefined }),
    }),
  recent: (limit = 10) => request<ReportSummary[]>(`/api/analyses?limit=${limit}`),
  report: (id: string) => request<ReportDetail>(`/api/analyses/${encodeURIComponent(id)}`),
  /** Sends a voice recording to Whisper (via the server) and returns the recognized text. */
  transcribe: (audio: Blob) =>
    request<{ text: string }>("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": audio.type || "audio/webm" },
      body: audio,
    }),
  chats: () => request<ChatSummary[]>("/api/chats"),
  tasks: () => request<Task[]>("/api/tasks"),
  updateTask: (id: string, patch: UpdateTaskRequest) =>
    request<Task>(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  commitments: () => request<MeetingCommitment[]>("/api/commitments"),
  chat: (id: string) => request<ChatDetail>(`/api/chats/${encodeURIComponent(id)}`),
  send: (body: SendMessageRequest) =>
    request<SendMessageResponse>("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
