import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarDays, Check, TriangleAlert } from "lucide-react";
import type { MeetingCommitment, Task } from "../../../shared/tasks.ts";
import { api } from "../lib/api.ts";
import { formatDay, formatReminder, pluralize } from "../lib/format.ts";
import { NO_DEADLINE } from "../lib/reportText.ts";

/** Обязательства: the CEO's own tasks and all commitments from meetings, in one place (D6, D9). */
export function TasksView() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [commitments, setCommitments] = useState<MeetingCommitment[] | null>(null);
  const [error, setError] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    Promise.all([api.tasks(), api.commitments()])
      .then(([t, c]) => {
        setTasks(t);
        setCommitments(c);
      })
      .catch(() => setError(true));
  }, []);

  const toggle = async (t: Task) => {
    try {
      const updated = await api.updateTask(t.id, { status: t.status === "done" ? "open" : "done" });
      setTasks((all) => all?.map((x) => (x.id === t.id ? updated : x)) ?? null);
    } catch {
      setError(true);
    }
  };

  const open = useMemo(() => tasks?.filter((t) => t.status === "open") ?? [], [tasks]);
  const done = useMemo(() => tasks?.filter((t) => t.status === "done") ?? [], [tasks]);
  const byMeeting = useMemo(() => {
    const groups = new Map<string, { title: string; date: string; items: MeetingCommitment[] }>();
    for (const c of commitments ?? []) {
      const g = groups.get(c.reportId) ?? { title: c.meetingTitle, date: c.meetingDate, items: [] };
      g.items.push(c);
      groups.set(c.reportId, g);
    }
    return [...groups.entries()];
  }, [commitments]);

  if (error) {
    return (
      <div className="page">
        <div className="notice notice--error">
          <TriangleAlert size={18} /> Не удалось загрузить задачи.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page__title">Обязательства</h1>
      <p className="page__sub">
        Ваши задачи и обязательства участников встреч. Новую задачу можно поставить в чате: «Напомни в пятницу…».
      </p>

      <h2 className="block-title">
        Мои задачи <span className="count">{open.length}</span>
      </h2>
      {tasks === null ? (
        <span className="sk sk--block" />
      ) : open.length === 0 ? (
        <p className="empty-line">Открытых задач нет. Скажите или напишите ассистенту, что нужно запомнить.</p>
      ) : (
        <ul className="task-list">
          {open.map((t) => (
            <TaskRow key={t.id} t={t} onToggle={toggle} />
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <button className="link-btn" onClick={() => setShowDone((v) => !v)} style={{ marginTop: 8 }}>
          {showDone ? "Скрыть выполненные" : `Показать выполненные (${done.length})`}
        </button>
      )}
      {showDone && (
        <ul className="task-list">
          {done.map((t) => (
            <TaskRow key={t.id} t={t} onToggle={toggle} />
          ))}
        </ul>
      )}

      <h2 className="block-title">
        Из встреч <span className="count">{commitments?.length ?? 0}</span>
        <span className="badge badge--pending" style={{ marginLeft: 8 }}>
          <span className="badge__dot" />
          Не проверено
        </span>
      </h2>
      {commitments === null ? (
        <span className="sk sk--block" />
      ) : byMeeting.length === 0 ? (
        <p className="empty-line">Пока нет обязательств: разберите встречу в чате.</p>
      ) : (
        byMeeting.map(([reportId, g]) => (
          <section key={reportId} className="meeting-group">
            <a className="meeting-group__title" href={`#/report/${reportId}`}>
              {g.title}
            </a>
            <span className="row__meta"> · {pluralize(g.items.length, ["обязательство", "обязательства", "обязательств"])}</span>
            <ul className="commit-list">
              {g.items.map((c, i) => (
                <li key={i}>
                  <span className="chip chip--owner">{c.owner}</span> {c.action}
                  {c.deadline ? (
                    <span className="chip chip--deadline">
                      <CalendarDays size={14} /> {c.deadline}
                    </span>
                  ) : (
                    <span className="chip chip--nodeadline">{NO_DEADLINE}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TaskRow({ t, onToggle }: { t: Task; onToggle: (t: Task) => void }) {
  const done = t.status === "done";
  const overdue = !done && t.dueDate !== null && t.dueDate < new Date().toISOString().slice(0, 10);
  return (
    <li className={`task-row ${done ? "is-done" : ""}`}>
      <button className={`check ${done ? "is-checked" : ""}`} onClick={() => onToggle(t)} aria-label={done ? "Вернуть в работу" : "Отметить выполненной"}>
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <span className="task-row__main">
        <span className="task-row__title">{t.title}</span>
        <span className="item__chips">
          {t.dueDate && (
            <span className={`chip ${overdue ? "chip--missing" : "chip--deadline"}`}>
              <CalendarDays size={14} /> {overdue ? "Просрочено · " : ""}
              {formatDay(t.dueDate)}
            </span>
          )}
          {t.remindAt && (
            <span className="chip chip--muted">
              <BellRing size={14} /> {formatReminder(t.remindAt)}
            </span>
          )}
        </span>
      </span>
    </li>
  );
}
