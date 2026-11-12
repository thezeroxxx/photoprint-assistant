import type { ModelReport } from "../shared/report.ts";
import { LlmError, type LlmClient, type StructuredRequest, type StructuredResponse } from "../server/llm/types.ts";

/** Fake model: returns queued responses (or throws queued errors) in order. */
export class FakeLlm implements LlmClient {
  readonly model = "fake/model";
  calls: StructuredRequest[] = [];
  private readonly queue: (unknown | Error)[];
  constructor(...queue: (unknown | Error)[]) {
    this.queue = queue;
  }
  async generateStructured(req: StructuredRequest): Promise<StructuredResponse> {
    this.calls.push(req);
    const next = this.queue.shift();
    if (next === undefined) throw new LlmError("upstream", "no more fake responses");
    if (next instanceof Error) throw next;
    return {
      data: next,
      rawText: JSON.stringify(next),
      model: this.model,
      durationMs: 5,
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, costUsd: 0.0001 },
    };
  }
}

export const TRANSCRIPT = `Андрей Ковалёв: Я проведу инвентаризацию бумаги и подготовлю отчёт до пятницы.
Сергей Лебедев: Хорошо, я возьму на себя настройку автоматической выгрузки остатков со склада.
Андрей Ковалёв: Нам бы вообще надо когда-нибудь пересмотреть всю систему складского учёта.
Генеральный директор: Решили: с 1 декабря линия работает в две смены.`;

export function validModelReport(overrides: Partial<ModelReport> = {}): ModelReport {
  return {
    meeting_title: "Совещание по складу",
    summary: "Обсудили остатки бумаги и график смен.",
    decisions: [{ text: "С 1 декабря линия работает в две смены." }],
    commitments: [
      {
        action: "Провести инвентаризацию бумаги и подготовить отчёт",
        owner: "Андрей Ковалёв",
        deadline: "до пятницы",
        evidence_quote: "Я проведу инвентаризацию бумаги и подготовлю отчёт до пятницы.",
      },
      {
        action: "Настроить автоматическую выгрузку остатков",
        owner: "Сергей Лебедев",
        deadline: null,
        evidence_quote: "«я возьму на себя настройку автоматической выгрузки остатков»",
      },
    ],
    needs_clarification: [
      {
        statement: "Пересмотреть систему складского учёта",
        missing: ["owner", "deadline"],
        missing_note: null,
        evidence_quote: "надо когда-нибудь пересмотреть всю систему складского учета",
      },
    ],
    open_questions: [],
    suggested_next_steps: [{ text: "Назначить ответственного за пересмотр складского учёта." }],
    ...overrides,
  };
}

/** Fake speech-to-text: returns queued texts (or throws queued errors). */
export class FakeStt {
  readonly model = "fake/whisper";
  calls: { bytes: number; format: string }[] = [];
  private readonly queue: (string | Error)[];
  constructor(...queue: (string | Error)[]) {
    this.queue = queue;
  }
  async transcribe(audio: Buffer, format: string) {
    this.calls.push({ bytes: audio.length, format });
    const next = this.queue.shift() ?? "";
    if (next instanceof Error) throw next;
    return { text: next, model: this.model, durationMs: 5 };
  }
}
