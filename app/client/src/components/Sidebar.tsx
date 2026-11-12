import { FileText, ListChecks, SquarePen } from "lucide-react";
import type { ChatSummary } from "../../../shared/chat.ts";
import { formatRelative } from "../lib/format.ts";
import type { Route } from "../lib/route.ts";
import { BrandMark } from "./ui.tsx";

export function Sidebar({
  route,
  chats,
  chatsError,
  onNavigate,
}: {
  route: Route;
  chats: ChatSummary[] | null;
  chatsError: boolean;
  onNavigate: () => void;
}) {
  const inMeetings = route.name === "meetings" || route.name === "report";
  return (
    <aside className="sidebar" aria-label="Меню">
      <div className="brand">
        <BrandMark />
        <div>
          <div className="brand__name">Ассистент руководителя</div>
          <div className="brand__sub">Photoprint</div>
        </div>
      </div>

      <a href="#/" className={`nav-item ${route.name === "new" ? "is-active" : ""}`} onClick={onNavigate}>
        <SquarePen size={18} /> Новый чат
      </a>
      <a href="#/meetings" className={`nav-item ${inMeetings ? "is-active" : ""}`} onClick={onNavigate}>
        <FileText size={18} /> Встречи
      </a>
      <a href="#/tasks" className={`nav-item ${route.name === "tasks" ? "is-active" : ""}`} onClick={onNavigate}>
        <ListChecks size={18} /> Обязательства
      </a>

      <div className="side-label">Чаты</div>
      <nav className="chat-list" aria-label="История чатов">
        {chatsError ? (
          <p className="side-empty">Не удалось загрузить чаты.</p>
        ) : chats === null ? null : chats.length === 0 ? (
          <p className="side-empty">Здесь появятся ваши чаты.</p>
        ) : (
          chats.map((c) => (
            <a
              key={c.id}
              href={`#/chat/${c.id}`}
              className={`chat-link ${route.name === "chat" && route.id === c.id ? "is-active" : ""}`}
              onClick={onNavigate}
            >
              <span className="chat-link__title">{c.title}</span>
              <span className="chat-link__date">{formatRelative(c.updatedAt)}</span>
            </a>
          ))
        )}
      </nav>
    </aside>
  );
}
