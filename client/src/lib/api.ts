import type { ApiError, ReportDetail, ReportSummary } from "../../../shared/report.ts";

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
  recent: () => request<ReportSummary[]>("/api/analyses"),
  report: (id: string) => request<ReportDetail>(`/api/analyses/${encodeURIComponent(id)}`),
};
