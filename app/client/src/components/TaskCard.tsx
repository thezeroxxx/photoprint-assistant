import { useState } from "react";
import { BellRing, CalendarDays, Check, CircleCheckBig } from "lucide-react";
import type { Task } from "../../../shared/tasks.ts";
import { api } from "../lib/api.ts";
import { formatDay, formatReminder } from "../lib/format.ts";
import { notificationsState, requestNotifications } from "../lib/useReminders.ts";

/** Card shown under an assistant reply when it created or completed a task. */
export function TaskCard({ task, completed = false }: { task: Task; completed?: boolean }) {
  const [current, setCurrent] = useState(task);
  const [perm, setPerm] = useState(notificationsState());
  const done = current.status === "done";

  const toggle = async () => {
    try {
      setCurrent(await api.updateTask(current.id, { status: done ? "open" : "done" }));
    } catch {
      /* keep the previous state; the tasks page shows the truth */
    }
  };

  return (
    <div className={`task-card ${done ? "is-done" : ""}`}>
      <div className="task-card__label">
        {completed ? <CircleCheckBig size={15} /> : <Check size={15} />}
        {completed ? "Задача выполнена" : "Задача создана"}
      </div>
      <div className="task-card__row">
        <button className={`check ${done ? "is-checked" : ""}`} onClick={toggle} aria-label={done ? "Вернуть в работу" : "Отметить выполненной"}>
          {done && <Check size={14} strokeWidth={3} />}
        </button>
        <span className="task-card__title">{current.title}</span>
      </div>
      <div className="item__chips">
        {current.dueDate && (
          <span className="chip chip--deadline">
            <CalendarDays size={14} /> {formatDay(current.dueDate)}
          </span>
        )}
        {current.remindAt && (
          <span className="chip chip--muted">
            <BellRing size={14} /> Напомню {formatReminder(current.remindAt)}
          </span>
        )}
      </div>
      {current.remindAt && !done && perm === "default" && (
        <button className="link-btn" onClick={async () => setPerm(await requestNotifications())}>
          Включить уведомления в браузере
        </button>
      )}
      {current.remindAt && !done && perm === "denied" && (
        <p className="task-card__hint">Уведомления браузера выключены — напоминание появится внутри приложения.</p>
      )}
    </div>
  );
}
