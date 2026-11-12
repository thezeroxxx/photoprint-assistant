import { useCallback, useEffect, useState } from "react";
import { ClipboardPaste, FileText, History, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import type { ReportDetail, ReportSummary } from "../../../shared/report.ts";
import sampleTranscript from "../../../samples/demo-transcript-ru.txt?raw";
import { api, ApiRequestError } from "../lib/api.ts";
import { formatRelative, formatToday, greeting, pluralize } from "../lib/format.ts";
import { GlassIcon, StatusBadge } from "../components/ui.tsx";

const MIN_CHARS = 50;
const MAX_CHARS = 60_000;

export function HomeView({ onOpenReport }: { onOpenReport: (id: string, detail?: ReportDetail) => void }) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string }>({
    kind: "idle",
  });
  const [recent, setRecent] = useState<ReportSummary[] | null>(null);
  const [recentError, setRecentError] = useState(false);

  useEffect(() => {
    api
      .recent()
      .then(setRecent)
      .catch(() => setRecentError(true));
  }, []);

  const length = transcript.trim().length;
  const tooShort = length > 0 && length < MIN_CHARS;
  const tooLong = length > MAX_CHARS;
  const canSubmit = length >= MIN_CHARS && !tooLong && state.kind !== "loading";

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setState({ kind: "loading" });
    try {
      const detail = await api.analyze(transcript, title);
      onOpenReport(detail.id, detail);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof ApiRequestError ? err.message : "Не удалось выполнить анализ. Попробуйте ещё раз.",
      });
    }
  }, [canSubmit, transcript, title, onOpenReport]);

  const loading = state.kind === "loading";

  return (
    <div className="home">
      <section className="hero">
        <div>
          <h1 className="hero__title">
            {greeting()} <span className="hero__light">Готов разобрать вашу встречу.</span>
          </h1>
          <p className="hero__sub">{formatToday()}</p>
        </div>
      </section>

      <div className="home__grid">
        <section className="card card--glass analyze" aria-labelledby="analyze-title">
          <div className="card__head">
            <GlassIcon icon={Sparkles} tone="lavender" />
            <div>
              <h2 id="analyze-title" className="card__title">
                Новый анализ встречи
              </h2>
              <p className="card__hint">Вставьте расшифровку — ассистент выделит решения, обязательства и открытые вопросы.</p>
            </div>
          </div>

          <label className="field">
            <span className="field__label">Название встречи (необязательно)</span>
            <input
              className="input"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Еженедельное совещание руководителей"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span className="field__row">
              <span className="field__label">Расшифровка встречи</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setTranscript(sampleTranscript);
                  if (!title) setTitle("Еженедельное совещание руководителей");
                }}
                disabled={loading}
              >
                <ClipboardPaste size={16} /> Вставить пример
              </button>
            </span>
            <textarea
              className="input textarea"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={"Ирина Белова: Предлагаю закупить комплект новых роликов…\nГенеральный директор: Хорошо, решили…"}
              disabled={loading}
              spellCheck={false}
            />
            <span className={`field__counter ${tooShort || tooLong ? "is-warn" : ""}`}>
              {tooShort
                ? `Нужно ещё ${pluralize(MIN_CHARS - length, ["символ", "символа", "символов"])}`
                : tooLong
                  ? `Слишком длинно: максимум ${MAX_CHARS.toLocaleString("ru-RU")} символов`
                  : `${length.toLocaleString("ru-RU")} ${pluralize(length, ["символ", "символа", "символов"], false)}`}
            </span>
          </label>

          {state.kind === "error" && (
            <div className="notice notice--error" role="alert">
              <TriangleAlert size={18} />
              <span>{state.message}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={submit}>
                <RotateCcw size={16} /> Повторить
              </button>
            </div>
          )}

          <div className="analyze__actions">
            <button type="button" className="btn btn--primary" onClick={submit} disabled={!canSubmit}>
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Анализирую…
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Проанализировать
                </>
              )}
            </button>
            <span className="analyze__note">
              {loading ? "Обычно это занимает до минуты." : "Отчёт будет сохранён со статусом «Ожидает проверки»."}
            </span>
          </div>
        </section>

        <section className="card card--glass recent" aria-labelledby="recent-title">
          <div className="card__head">
            <GlassIcon icon={History} tone="blue" />
            <div>
              <h2 id="recent-title" className="card__title">
                Недавние отчёты
              </h2>
              <p className="card__hint">Последние 10 анализов.</p>
            </div>
          </div>
          {recentError ? (
            <p className="empty">Не удалось загрузить список.</p>
          ) : recent === null ? (
            <div className="skeleton-list">
              <span className="sk sk--row" />
              <span className="sk sk--row" />
              <span className="sk sk--row" />
            </div>
          ) : recent.length === 0 ? (
            <div className="empty">
              <GlassIcon icon={FileText} tone="blue" size="l" />
              <p>Здесь появятся ваши отчёты. Начните с примера — нажмите «Вставить пример».</p>
            </div>
          ) : (
            <ul className="recent__list">
              {recent.map((r) => (
                <li key={r.id}>
                  <button className="recent__item" onClick={() => onOpenReport(r.id)}>
                    <span className="recent__main">
                      <span className="recent__title">{r.title}</span>
                      <span className="recent__meta">
                        {formatRelative(r.createdAt)}
                        {r.counts && (
                          <>
                            {" · "}
                            {pluralize(r.counts.commitments, ["обязательство", "обязательства", "обязательств"])}
                            {r.counts.clarifications > 0 &&
                              ` · ${r.counts.clarifications} требу${r.counts.clarifications === 1 ? "ет" : "ют"} уточнения`}
                          </>
                        )}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
