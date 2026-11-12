import { useCallback, useEffect, useState } from "react";
import type { Task } from "../../../shared/tasks.ts";
import { api } from "./api.ts";

const POLL_MS = 30_000;

export type NotificationsState = "granted" | "denied" | "default" | "unsupported";

export const notificationsState = (): NotificationsState =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

export async function requestNotifications(): Promise<NotificationsState> {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.requestPermission();
}

/**
 * Checks tasks while the app is open and fires reminders whose time has come:
 * an in-app banner, plus a browser notification when permitted. Each reminder fires once.
 * Limitation: nothing fires while the app is closed (no push service in this phase).
 */
export function useReminders() {
  const [due, setDue] = useState<Task[]>([]);

  const check = useCallback(async () => {
    let tasks: Task[];
    try {
      tasks = await api.tasks();
    } catch {
      return;
    }
    const now = Date.now();
    const fire = tasks.filter((t) => t.status === "open" && t.remindAt && !t.remindedAt && new Date(t.remindAt).getTime() <= now);
    for (const t of fire) {
      try {
        await api.updateTask(t.id, { reminded: true });
      } catch {
        continue; // try again next time instead of showing it twice
      }
      if (notificationsState() === "granted") new Notification("Напоминание", { body: t.title, tag: t.id });
      setDue((d) => [...d.filter((x) => x.id !== t.id), t]);
    }
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(check, POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [check]);

  const dismiss = (id: string) => setDue((d) => d.filter((t) => t.id !== id));
  const complete = async (id: string) => {
    dismiss(id);
    try {
      await api.updateTask(id, { status: "done" });
    } catch {
      /* the tasks page still shows it as open */
    }
  };
  return { due, dismiss, complete, check };
}
