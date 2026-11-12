import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { ReportSummary } from "../../../shared/report.ts";
import { api } from "../lib/api.ts";
import { formatDateTime, pluralize } from "../lib/format.ts";
import { go } from "../lib/route.ts";
import { StatusBadge } from "../components/ui.tsx";

export function MeetingsView() {
  const [items, setItems] = useState<ReportSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.recent(200).then(setItems).catch(() => setError(true));
  }, []);

  return (
    <div className="page">
      <h1 className="page__title">Встречи</h1>
      <p className="page__sub">Все разобранные встречи. Новую встречу можно разобрать в любом чате.</p>

      {error ? (
        <div className="notice notice--error" style={{ marginTop: 20 }}>
          <TriangleAlert size={18} /> Не удалось загрузить список встреч.
        </div>
      ) : items === null ? (
        <div style={{ marginTop: 20 }}>
          <span className="sk sk--block" />
          <span className="sk sk--block" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          Пока нет разобранных встреч.{" "}
          <a href="#/">Начните новый чат</a> и вставьте расшифровку.
        </div>
      ) : (
        <ul className="rows">
          {items.map((r) => (
            <li key={r.id}>
              <button className="row" onClick={() => go(`#/report/${r.id}`)}>
                <span className="row__main">
                  <span className="row__title">{r.title}</span>
                  <span className="row__meta">
                    {formatDateTime(r.createdAt)}
                    {r.counts &&
                      ` · ${pluralize(r.counts.decisions, ["решение", "решения", "решений"])} · ${pluralize(r.counts.commitments, [
                        "обязательство",
                        "обязательства",
                        "обязательств",
                      ])}`}
                  </span>
                </span>
                <StatusBadge status={r.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
