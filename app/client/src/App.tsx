import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, Menu, SquarePen, X } from "lucide-react";
import type { ChatSummary } from "../../shared/chat.ts";
import { api } from "./lib/api.ts";
import { go, parseHash, type Route } from "./lib/route.ts";
import { Sidebar } from "./components/Sidebar.tsx";
import { ChatView } from "./views/ChatView.tsx";
import { MeetingsView } from "./views/MeetingsView.tsx";
import { ReportView } from "./views/ReportView.tsx";
import { TasksView } from "./views/TasksView.tsx";
import { useReminders } from "./lib/useReminders.ts";

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [chatsError, setChatsError] = useState(false);

  const loadChats = useCallback(() => {
    api
      .chats()
      .then((c) => {
        setChats(c);
        setChatsError(false);
      })
      .catch(() => setChatsError(true));
  }, []);

  useEffect(loadChats, [loadChats]);
  const reminders = useReminders();

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const mobileTitle =
    route.name === "chat"
      ? (chats?.find((c) => c.id === route.id)?.title ?? "Чат")
      : route.name === "new"
        ? "Новый чат"
        : "Встречи";

  return (
    <div className={`layout ${menuOpen ? "is-menu-open" : ""}`}>
      <Sidebar route={route} chats={chats} chatsError={chatsError} onNavigate={() => setMenuOpen(false)} />
      <div className="scrim" onClick={() => setMenuOpen(false)} />

      <div className="main">
        <header className="mobile-bar">
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
            <Menu size={22} />
          </button>
          <span className="mobile-bar__title">{mobileTitle}</span>
          <a className="icon-btn" href="#/" aria-label="Новый чат">
            <SquarePen size={20} />
          </a>
        </header>

        {route.name === "new" || route.name === "chat" ? (
          <ChatView
            key={route.name === "chat" ? route.id : "new"}
            chatId={route.name === "chat" ? route.id : null}
            onChatCreated={(id) => go(`#/chat/${id}`)}
            onChatsChanged={() => {
              loadChats();
              void reminders.check();
            }}
          />
        ) : route.name === "meetings" ? (
          <MeetingsView />
        ) : route.name === "tasks" ? (
          <TasksView />
        ) : (
          <ReportView id={route.id} onBack={() => go("#/meetings")} />
        )}
      </div>

      {reminders.due.length > 0 && (
        <div className="toasts" role="status" aria-live="assertive">
          {reminders.due.map((t) => (
            <div key={t.id} className="toast">
              <BellRing size={18} className="toast__icon" />
              <div className="toast__body">
                <div className="toast__label">Напоминание</div>
                <div className="toast__title">{t.title}</div>
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => reminders.complete(t.id)}>
                <Check size={15} /> Готово
              </button>
              <button className="icon-btn" onClick={() => reminders.dismiss(t.id)} aria-label="Закрыть напоминание">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
