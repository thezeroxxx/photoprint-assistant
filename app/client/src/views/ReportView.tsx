import { useEffect, useState, type ReactNode } from "react";
import {
  AlignLeft,
  ArrowLeft,
  CalendarDays,
  Check,
  CircleCheckBig,
  CircleHelp,
  Copy,
  Cpu,
  Handshake,
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
import { GlassIcon, StatusBadge, type Tone } from "../components/ui.tsx";

export function ReportView({ id, initial, onBack }: { id: string; initial: ReportDetail | null; onBack: () => void }) {
  const [detail, setDetail] = useState<ReportDetail | null>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.id === id) return;
    setDetail(null);
    setError(null);
    api
      .report(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Не удалось загрузить отчёт."));
  }, [id, initial]);

  return (
    <div className="report">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={18} /> Все отчёты
      </button>
      {error ? (
        <div className="card card--solid notice notice--error" role="alert">
          <TriangleAlert size={18} /> {error}
        </div>
      ) : !detail ? (
        <ReportSkeleton />
      ) : detail.status === "failed" || !detail.report ? (
        <FailedReport detail={detail} />
      ) : (
        <ReportBody detail={detail} report={detail.report} />
      )}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="report-grid" aria-busy="true" aria-label="Загрузка отчёта">
      <span className="sk sk--title span-12" />
      <div className="card card--solid span-8">
        <span className="sk sk--line" />
        <span className="sk sk--line" />
        <span className="sk sk--line short" />
      </div>
      <div className="card card--solid span-4">
        <span className="sk sk--line" />
        <span className="sk sk--line short" />
      </div>
      <div className="card card--solid span-12">
        <span className="sk sk--block" />
        <span className="sk sk--block" />
      </div>
    </div>
  );
}

function FailedReport({ detail }: { detail: ReportDetail }) {
  return (
    <>
      <ReportHeader detail={detail} report={null} />
      <div className="card card--solid notice notice--error">
        <TriangleAlert size={18} /> Анализ этой встречи не удался. Попробуйте запустить его заново на главной странице.
      </div>
    </>
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

      <nav className="section-nav glass-bar" aria-label="Разделы отчёта">
        {chips.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="chip chip--nav" onClick={(e) => scrollToSection(e, c.id)}>
            {c.label}
            {c.count !== undefined && <span className="chip__count">{c.count}</span>}
          </a>
        ))}
      </nav>

      <div className="report-grid">
        {/* 1. Meeting Summary */}
        <Section id={SECTIONS.summary} n={1} title="Резюме встречи" icon={AlignLeft} className="span-8">
          <p className="summary">{report.summary}</p>
        </Section>

        {/* 2. Key Decisions */}
        <Section id={SECTIONS.decisions} n={2} title="Ключевые решения" icon={CircleCheckBig} count={report.decisions.length} className="span-4">
          {report.decisions.length ? (
            <ul className="bullets bullets--check">
              {report.decisions.map((d, i) => (
                <li key={i}>{d.text}</li>
              ))}
            </ul>
          ) : (
            <Empty>Явных решений на встрече не принято.</Empty>
          )}
        </Section>

        {/* 3. Confirmed Commitments */}
        <Section
          id={SECTIONS.commitments}
          n={3}
          title="Подтверждённые обязательства"
          icon={Handshake}
          tone="mint"
          count={report.commitments.length}
          className="span-12"
        >
          {report.commitments.length ? (
            <div className="items">
              {report.commitments.map((c, i) => (
                <CommitmentCard key={i} c={c} />
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
            n={4}
            title="Требуют уточнения"
            icon={CircleHelp}
            dot
            count={report.needs_clarification.length}
            className="span-6"
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
        <Section
          id={SECTIONS.open}
          n={hasClarify ? 5 : 4}
          title="Открытые вопросы"
          icon={MessagesSquare}
          count={report.open_questions.length}
          className={hasClarify ? "span-6" : "span-12"}
        >
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
          n={hasClarify ? 6 : 5}
          title="Предлагаемые шаги"
          icon={Sparkles}
          tone="lavender"
          className="span-12 section--ai"
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
      </div>

      <TechDetails detail={detail} />
    </>
  );
}

function scrollToSection(e: React.MouseEvent, id: string) {
  // Keep the hash route intact; just scroll.
  e.preventDefault();
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
      <div className="report-head__text">
        <div className="report-head__badges">
          <StatusBadge status={detail.status} />
          <span className="chip chip--glass">{formatDateTime(detail.createdAt)}</span>
        </div>
        <h1 className="report-head__title">{detail.title}</h1>
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
  n,
  title,
  icon,
  tone = "blue",
  dot = false,
  count,
  note,
  className = "",
  children,
}: {
  id: string;
  n: number;
  title: string;
  icon: LucideIcon;
  tone?: Tone;
  dot?: boolean;
  count?: number;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`card card--solid section ${className}`} style={{ animationDelay: `${n * 45}ms` }}>
      <div className="section__head">
        <GlassIcon icon={icon} tone={tone} dot={dot} />
        <div className="section__titles">
          <h2 className="section__title">{title}</h2>
          {note && <p className="section__note">{note}</p>}
        </div>
        {count !== undefined && <span className="pill">{count}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-line">{children}</p>;
}

function CommitmentCard({ c }: { c: Commitment }) {
  return (
    <article className="item item--commitment">
      <p className="item__title">{c.action}</p>
      <div className="item__chips">
        <span className="chip chip--owner">
          <span className="avatar" aria-hidden="true">
            {initials(c.owner)}
          </span>
          {c.owner}
        </span>
        {c.deadline ? (
          <span className="chip chip--deadline">
            <CalendarDays size={15} /> {c.deadline}
          </span>
        ) : (
          <span className="chip chip--nodeadline">
            <CalendarDays size={15} /> {NO_DEADLINE}
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
        <span className="evidence__ok">
          <Check size={13} /> сверено
        </span>
      </summary>
      <blockquote>«{quote}»</blockquote>
    </details>
  );
}

function TechDetails({ detail }: { detail: ReportDetail }) {
  return (
    <details className="tech card card--glass">
      <summary>
        <Cpu size={16} /> Технические детали
      </summary>
      <dl>
        <dt>Модель</dt>
        <dd>{detail.model}</dd>
        <dt>Токены</dt>
        <dd>
          {detail.usage.totalTokens?.toLocaleString("ru-RU") ?? "—"}
          {detail.usage.promptTokens !== null &&
            ` (вход ${detail.usage.promptTokens.toLocaleString("ru-RU")}, выход ${detail.usage.completionTokens?.toLocaleString("ru-RU") ?? "—"})`}
        </dd>
        <dt>Стоимость</dt>
        <dd>{formatCost(detail.usage.costUsd)}</dd>
        <dt>Время анализа</dt>
        <dd>{formatSeconds(detail.durationMs)}</dd>
        <dt>Версия промпта</dt>
        <dd>{detail.promptVersion ?? "—"}</dd>
      </dl>
    </details>
  );
}

function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}
