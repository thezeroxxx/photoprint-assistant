/**
 * Chat contract shared by the server and the client.
 * Chats are conversations with the assistant; facts (meetings, reports) live in their own tables
 * and are referenced from messages, never copied into chat history.
 */

export type MessageRole = "user" | "assistant";

/**
 * text           — plain text message (user or assistant)
 * transcript     — user message that was a meeting transcript (shown collapsed)
 * meeting_report — assistant message pointing to a stored meeting report (rendered as a summary card)
 */
export type MessageKind = "text" | "transcript" | "meeting_report";

import type { Task } from "./tasks.ts";

/** A stored meeting an assistant answer is based on. */
export interface SourceRef {
  reportId: string;
  title: string;
  createdAt: string;
}

/** What the assistant did in this turn (shown as cards under its reply). */
export interface MessageMeta {
  sources?: SourceRef[];
  createdTasks?: Task[];
  completedTasks?: Task[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  createdAt: string;
  role: MessageRole;
  kind: MessageKind;
  text: string;
  reportId: string | null;
  meta: MessageMeta | null;
}

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatDetail extends ChatSummary {
  messages: ChatMessage[];
}

/** POST /api/chat body. Without chatId a new chat is created. */
export interface SendMessageRequest {
  chatId?: string;
  text: string;
  /** "transcript" forces meeting analysis (attach button); "auto" detects transcripts by their shape. */
  mode?: "auto" | "transcript";
}

/** POST /api/chat response: the chat and the messages added by this exchange. */
export interface SendMessageResponse {
  chat: ChatSummary;
  added: ChatMessage[];
}
