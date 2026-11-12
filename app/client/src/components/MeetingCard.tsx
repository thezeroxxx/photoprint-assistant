import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { ReportDetail } from "../../../shared/report.ts";
import { api } from "../lib/api.ts";
import { pluralize } from "../lib/format.ts";
import { NO_DEADLINE } from "../lib/reportText.ts";
import { StatusBadge } from "./ui.tsx";

const SHOW = 3;

/** Compact summary of a stored meeting report, shown as an assistant message in the chat. */
export function MeetingCard({ reportId }: { reportId: string }) {
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.report(reportId).then(setDetail).catch(() => setFailed(true));
  }, [reportId]);

  if (failed) return <div className="mcard">Не удалось загрузить отчёт.</div>;
  if (!detail) {
    return (
      <div className="mcard" aria-busy="true">
        <span className="sk sk--line" />
        <span className="sk sk--line short" />
      </div>
    );
  }
  const r = detail.report;
  if (!r) return <div className="mcard">Анализ этой встречи не удался.</div>;

  return (
    <article className="mcard">
      <div className="mcard__top">
        <StatusBadge status={detail.status} />
      </div>
      <h3 className="mcard__title">{detail.title}</h3>
      <p className="mcard__summary">{r.summary}</p>

      <div className="mcard__counts">
        <span className="chip chip--muted">{pluralize(r.decisions.length, ["решение", "решения", "решений"])}</span>
        <span className="chip chip--muted">
          {pluralize(r.commitments.length, ["обязательство", "обязательства", "обязательств"])}
        </span>
        {r.needs_clarification.length > 0 && (
          <span className="chip chip--missing">
            {r.needs_clarification.length} {pluralize(r.needs_clarification.length, ["требует", "требуют", "требуют"], false)} уточнения
          </span>
        )}
        <span className="chip chip--muted">
          {pluralize(r.open_questions.length, ["открытый вопрос", "открытых вопроса", "открытых вопросов"])}
        </span>
      </div>

      {r.commitments.length > 0 && (
        <ul className="mcard__list">
          {r.commitments.slice(0, SHOW).map((c, i) => (
            <li key={i}>
              <strong>{c.owner}:</strong> {c.action}
              {c.deadline ? (
                <span className="chip chip--deadline">
                  <CalendarDays size={14} /> {c.deadline}
                </span>
              ) : (
                <span className="chip chip--nodeadline">{NO_DEADLINE}</span>
              )}
            </li>
          ))}
          {r.commitments.length > SHOW && (
            <li className="mcard__more">и ещё {r.commitments.length - SHOW} в полном отчёте</li>
          )}
        </ul>
      )}

      <a className="btn btn--primary btn--sm" href={`#/report/${detail.id}`}>
        Открыть отчёт <ArrowRight size={16} />
      </a>
    </article>
  );
}
