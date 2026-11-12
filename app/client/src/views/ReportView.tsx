import { useEffect, useState, type ReactNode } from "react";
import {
  AlignLeft,
  ArrowLeft,
  CalendarDays,
  Check,
  CircleCheckBig,
  CircleHelp,
  Copy,
  Handshake,
  Info,
  MessagesSquare,
  Quote,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ClarificationItem, Commitment, EvidenceStatus, MeetingReport, ReportDetail } from "../../../shared/report.ts";
import { api, ApiRequestError } from "../lib/api.ts";
import { formatCost, formatDateTime, formatSeconds } from "../lib/format.ts";
import { MISSING_LABELS, NO_DEADLINE, reportToText } from "../lib/reportText.ts";
import { StatusBadge } from "../components/ui.tsx";

export function ReportView({ id, onBack }: { id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    api
      .report(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Не удалось загрузить отчёт."));
  }, [id]);

  return (
    <div className="page">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={18} /> Встречи
      </button>
      {error ? (
        <div className="notice notice--error" role="alert">
          <TriangleAlert size={18} /> {error}
        </div>
      ) : !detail ? (
        <div aria-busy="true" aria-label="Загрузка отчёта">
          <span className="sk sk--title" />
          <span className="sk sk--line" />
          <span className="sk sk--line" />
          <span className="sk sk--line short" />
          <span className="sk sk--block" />
        </div>
      ) : detail.status === "failed" || !detail.report ? (
        <>
          <ReportHeader detail={detail} report={null} />
          <div className="notice notice--error">
            <TriangleAlert size={18} /> Анализ этой встречи не удался. Отправьте расшифровку в чат ещё раз.
          </div>
        </>
      ) : (
        <ReportBody detail={detail} report={detail.report} />
      )}
    </div>
  );
}

const SECTIONS = {
  summary: "s-summary",
  decisions: "s-decisions",
  commitments: "s-commitments",
  clarify: "s-clarify",
  open: "s-open",
  next: "s-next",
} as const;

function ReportBody({ detail, report }: { detail: ReportDetail; report: MeetingReport }) {
  const hasClarify = report.needs_clarification.length > 0;
  const chips: { id: string; label: string; count?: number }[] = [
    { id: SECTIONS.summary, label: "Резюме" },
    { id: SECTIONS.decisions, label: "Решения", count: report.decisions.length },
    { id: SECTIONS.commitments, label: "Обязательства", count: report.commitments.length },
    ...(hasClarify ? [{ id: SECTIONS.clarify, label: "Уточнить", count: report.needs_clarification.length }] : []),
    { id: SECTIONS.open, label: "Вопросы", count: report.open_questions.length },
    { id: SECTIONS.next, label: "Шаги", count: report.suggested_next_steps.length },
  ];

  return (
    <>
      <ReportHeader detail={detail} report={report} />

      <nav className="section-nav" aria-label="Разделы отчёта">
        {chips.map((c) => (
          <a key={c.id} href={`#${c.id}`} onClick={(e) => scrollToSection(e, c.id)}>
            {c.label}
            {c.count !== undefined && <span className="count">{c.count}</span>}
          </a>
        ))}
      </nav>

      {/* 1. Meeting Summary */}
      <Section id={SECTIONS.summary} title="Резюме встречи" icon={AlignLeft}>
        <p className="summary">{report.summary}</p>
      </Section>

      {/* 2. Key Decisions */}
      <Section id={SECTIONS.decisions} title="Ключевые решения" icon={CircleCheckBig}>
        {report.decisions.length ? (
          <ul className="bullets">
            {report.decisions.map((d, i) => (
              <li key={i}>{d.text}</li>
            ))}
          </ul>
        ) : (
          <Empty>Явных решений на встрече не принято.</Empty>
        )}
      </Section>

      {/* 3. Confirmed Commitments */}
      <Section id={SECTIONS.commitments} title="Подтверждённые обязательства" icon={Handshake} tone="ok">
        {report.commitments.length ? (
          <div className="items">
            {report.commitments.map((c, i) => (
              <CommitmentItem key={i} c={c} />
            ))}
          </div>
        ) : (
          <Empty>Явно принятых обязательств не найдено.</Empty>
        )}
      </Section>

      {/* 4. Needs Clarification — only when relevant */}
      {hasClarify && (
        <Section
          id={SECTIONS.clarify}
          title="Требуют уточнения"
          icon={CircleHelp}
          tone="warn"
          note="Это не задачи: ответственный, срок или согласие не подтверждены."
        >
          <div className="items">
            {report.needs_clarification.map((n, i) => (
              <ClarificationCard key={i} item={n} />
            ))}
          </div>
        </Section>
      )}

      {/* 5. Open Questions and Unresolved Issues */}
      <Section id={SECTIONS.open} title="Открытые вопросы" icon={MessagesSquare}>
        {report.open_questions.length ? (
          <ul className="bullets">
            {report.open_questions.map((q, i) => (
              <li key={i}>{q.text}</li>
            ))}
          </ul>
        ) : (
          <Empty>Нерешённых вопросов не осталось.</Empty>
        )}
      </Section>

      {/* 6. Suggested Next Steps — AI recommendations, never tasks */}
      <Section
        id={SECTIONS.next}
        title="Предлагаемые шаги"
        icon={Sparkles}
        tone="ai"
        className="section--ai"
        note="Предложение ИИ · не является поручением"
      >
        {report.suggested_next_steps.length ? (
          <ol className="steps">
            {report.suggested_next_steps.map((s, i) => (
              <li key={i}>{s.text}</li>
            ))}
          </ol>
        ) : (
          <Empty>Рекомендаций нет.</Empty>
        )}
      </Section>

      <TechDetails detail={detail} />
    </>
  );
}

function scrollToSection(e: React.MouseEvent, id: string) {
  e.preventDefault(); // keep the hash route intact
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ReportHeader({ detail, report }: { detail: ReportDetail; report: MeetingReport | null }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!report) return;
    const text = reportToText(detail, report);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="report-head">
      <div>
        <div className="report-head__meta">
          <StatusBadge status={detail.status} />
          <span>{formatDateTime(detail.createdAt)}</span>
        </div>
        <h1 className="page__title">{detail.title}</h1>
      </div>
      {report && (
        <button className="btn btn--secondary" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Скопировано" : "Копировать отчёт"}
        </button>
      )}
    </header>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  tone,
  note,
  className = "",
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  tone?: "ok" | "warn" | "ai";
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="section__head">
        <span className={`section__icon ${tone ? `section__icon--${tone}` : ""}`} aria-hidden="true">
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div>
          <h2 className="section__title">{title}</h2>
          {note && <p className="section__note">{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-line">{children}</p>;
}

function CommitmentItem({ c }: { c: Commitment }) {
  return (
    <article className="item">
      <p className="item__title">{c.action}</p>
      <div className="item__chips">
        <span className="chip chip--owner">{c.owner}</span>
        {c.deadline ? (
          <span className="chip chip--deadline">
            <CalendarDays size={14} /> {c.deadline}
          </span>
        ) : (
          <span className="chip chip--nodeadline">
            <CalendarDays size={14} /> {NO_DEADLINE}
          </span>
        )}
      </div>
      <Evidence quote={c.evidence_quote} status={c.evidence_status} />
    </article>
  );
}

function ClarificationCard({ item }: { item: ClarificationItem }) {
  return (
    <article className="item item--clarify">
      <p className="item__title">{item.statement}</p>
      <div className="item__chips">
        <span className="missing-label">Не хватает:</span>
        {item.missing.map((m) => (
          <span key={m} className="chip chip--missing">
            {MISSING_LABELS[m]}
          </span>
        ))}
      </div>
      {item.missing_note && <p className="item__note">{item.missing_note}</p>}
      <Evidence quote={item.evidence_quote} status={item.evidence_status} />
    </article>
  );
}

function Evidence({ quote, status }: { quote: string | null; status: EvidenceStatus }) {
  if (status !== "verified" || !quote) {
    return (
      <p className="evidence evidence--none">
        <Quote size={14} /> Цитата недоступна
      </p>
    );
  }
  return (
    <details className="evidence">
      <summary>
        <Quote size={14} /> Цитата из расшифровки
        <span className="evidence__ok">· сверено</span>
      </summary>
      <blockquote>«{quote}»</blockquote>
    </details>
  );
}

function TechDetails({ detail }: { detail: ReportDetail }) {
  return (
    <details className="tech">
      <summary>
        <Info size={15} /> Технические детали
      </summary>
      <dl>
        <dt>Модель</dt>
        <dd>{detail.model}</dd>
        <dt>Токены</dt>
        <dd>{detail.usage.totalTokens?.toLocaleString("ru-RU") ?? "—"}</dd>
        <dt>Стоимость</dt>
        <dd>{formatCost(detail.usage.costUsd)}</dd>
        <dt>Время анализа</dt>
        <dd>{formatSeconds(detail.durationMs)}</dd>
      </dl>
    </details>
  );
}
