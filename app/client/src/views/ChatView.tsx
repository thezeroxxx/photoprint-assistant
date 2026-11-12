import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, FileText, Mic, Paperclip, RotateCcw, Square, TriangleAlert } from "lucide-react";
import type { MessageMeta } from "../../../shared/chat.ts";
import type { ChatMessage, SendMessageRequest } from "../../../shared/chat.ts";
import sampleTranscript from "../../../samples/demo-transcript-ru.txt?raw";
import { api, ApiRequestError } from "../lib/api.ts";
import { formatToday, greeting, pluralize } from "../lib/format.ts";
import { BrandMark } from "../components/ui.tsx";
import { MeetingCard } from "../components/MeetingCard.tsx";
import { TaskCard } from "../components/TaskCard.tsx";
import { formatDateTime } from "../lib/format.ts";
import { useRecorder } from "../lib/useRecorder.ts";

const MAX_CHARS = 60_000;

/** Same shape check as the server, used only to choose the waiting message. */
const looksLikeTranscript = (t: string) =>
  t.length >= 300 && t.split("\n").filter((l) => /^[^\n:]{2,60}:\s+\S/.test(l.trim())).length >= 3;

interface Pending {
  request: SendMessageRequest;
  analyzing: boolean;
}

const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function ChatView({
  chatId,
  onChatCreated,
  onChatsChanged,
}: {
  chatId: string | null;
  onChatCreated: (id: string) => void;
  onChatsChanged: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(chatId));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<{ message: string; request: SendMessageRequest } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Voice (D10): tap the mic, speak, tap again → Whisper → the recognized text is sent immediately.
  const recorder = useRecorder(
    async (audio) => {
      setTranscribing(true);
      setError(null);
      try {
        const { text } = await api.transcribe(audio);
        setTranscribing(false);
        void send({ chatId: chatId ?? undefined, text, mode: "auto" });
      } catch (err) {
        setTranscribing(false);
        setError({
          message: err instanceof ApiRequestError ? err.message : "Не удалось распознать речь. Попробуйте ещё раз.",
          request: { text: "" },
        });
      }
    },
    (message) => setError({ message, request: { text: "" } }),
  );
  const busy = Boolean(pending) || transcribing || recorder.recording || recorder.requesting;

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    api
      .chat(chatId)
      .then((c) => setMessages(c.messages))
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Не удалось загрузить чат."))
      .finally(() => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    const toEnd = () => endRef.current?.scrollIntoView({ block: "end" });
    toEnd();
    // Meeting cards load their report after rendering and grow; scroll again once they settle.
    const t = window.setTimeout(toEnd, 400);
    return () => window.clearTimeout(t);
  }, [messages.length, pending, error]);

  // Grow the input with its content.
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [draft]);

  async function send(request: SendMessageRequest) {
    setError(null);
    setPending({ request, analyzing: request.mode === "transcript" || looksLikeTranscript(request.text) });
    try {
      const res = await api.send(request);
      setMessages((m) => [...m, ...res.added]);
      setPending(null);
      onChatsChanged();
      if (!chatId) onChatCreated(res.chat.id);
    } catch (err) {
      setPending(null);
      setError({
        message: err instanceof ApiRequestError ? err.message : "Не удалось отправить сообщение. Попробуйте ещё раз.",
        request,
      });
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text || pending) return;
    if (text.length > MAX_CHARS) {
      setError({ message: `Слишком длинный текст: максимум ${MAX_CHARS.toLocaleString("ru-RU")} символов.`, request: { text } });
      return;
    }
    setDraft("");
    void send({ chatId: chatId ?? undefined, text, mode: "auto" });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = (await file.text()).trim();
    if (fileRef.current) fileRef.current.value = "";
    if (!text) return setError({ message: "Файл пустой.", request: { text: "" } });
    if (text.length > MAX_CHARS) {
      return setError({ message: `Файл слишком большой: максимум ${MAX_CHARS.toLocaleString("ru-RU")} символов.`, request: { text: "" } });
    }
    void send({ chatId: chatId ?? undefined, text, mode: "transcript" });
  }

  const isEmpty = !chatId && messages.length === 0 && !pending && !transcribing;

  return (
    <div className="chat">
      <div className="chat__scroll">
        {loadError ? (
          <div className="notice notice--error">
            <TriangleAlert size={18} /> {loadError}
          </div>
        ) : isEmpty ? (
          <>
            {/* Errors that happen before the first message (microphone, file) must still be visible. */}
            {error && !error.request.text && (
              <div className="msg-error" role="alert" style={{ marginBottom: 16 }}>
                <TriangleAlert size={18} /> {error.message}
              </div>
            )}
          <EmptyState
            onSample={() => send({ text: sampleTranscript, mode: "transcript" })}
            onAsk={(text) => send({ text, mode: "auto" })}
            onDraft={(text) => {
              setDraft(text);
              textareaRef.current?.focus();
            }}
            onAttach={() => fileRef.current?.click()}
          />
          </>
        ) : (
          <div className="messages" aria-live="polite">
            {loading && <span className="sk sk--block" />}
            {messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {transcribing && (
              <div className="msg-assistant">
                <BrandMark size={28} />
                <div className="msg-assistant__body">
                  <span className="typing">
                    <span className="typing__dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    Распознаю речь…
                  </span>
                </div>
              </div>
            )}
            {pending && (
              <>
                <UserBubble text={pending.request.text} transcript={pending.analyzing} />
                <div className="msg-assistant">
                  <BrandMark size={28} />
                  <div className="msg-assistant__body">
                    <span className="typing">
                      <span className="typing__dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      {pending.analyzing ? "Анализирую расшифровку встречи — обычно до минуты" : "Думаю…"}
                    </span>
                  </div>
                </div>
              </>
            )}
            {error && (
              <div className="msg-error" role="alert">
                <TriangleAlert size={18} /> {error.message}
                {error.request.text && (
                  <button className="btn btn--secondary btn--sm" onClick={() => send(error.request)}>
                    <RotateCcw size={15} /> Повторить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div ref={endRef} className="chat__end" />
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            className="icon-btn"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Прикрепить расшифровку (.txt)"
            title="Прикрепить расшифровку (.txt)"
          >
            <Paperclip size={20} />
          </button>
          <label className="sr-only" htmlFor="composer-input">
            Сообщение ассистенту
          </label>
          <textarea
            id="composer-input"
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              recorder.recording
                ? `Идёт запись ${formatTimer(recorder.seconds)} — нажмите ■, чтобы отправить`
                : "Спросите, продиктуйте или вставьте расшифровку встречи…"
            }
            disabled={busy}
          />
          {!draft.trim() ? (
            recorder.recording ? (
              <button className="send-btn send-btn--rec" type="button" onClick={recorder.stop} aria-label="Остановить запись и отправить">
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                className="icon-btn mic-btn"
                type="button"
                onClick={recorder.start}
                disabled={Boolean(pending) || transcribing || recorder.requesting}
                aria-label="Голосовое сообщение"
                title="Голосовое сообщение"
              >
                <Mic size={20} />
              </button>
            )
          ) : (
            <button className="send-btn" type="button" onClick={submit} disabled={!draft.trim() || busy} aria-label="Отправить">
              <ArrowUp size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>
        <p className="composer-hint">
          {recorder.requesting ? (
            <span className="rec-hint rec-hint--wait">Разрешите доступ к микрофону в окне браузера (обычно слева вверху, у адресной строки)…</span>
          ) : recorder.recording ? (
            <span className="rec-hint">
              <span className="rec-dot" /> Запись {formatTimer(recorder.seconds)}
              <span className="level" aria-label="Уровень звука">
                <span className="level__bar" style={{ width: `${Math.round(recorder.level * 100)}%` }} />
              </span>
              {recorder.silent && <span className="rec-silent">Не слышу звук — проверьте, какой микрофон выбран в системе</span>}
            </span>
          ) : (
            "Нажмите микрофон, чтобы говорить. Расшифровку с репликами «Имя: …» ассистент разберёт как встречу."
          )}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  onSample,
  onAsk,
  onDraft,
  onAttach,
}: {
  onSample: () => void;
  onAsk: (text: string) => void;
  onDraft: (text: string) => void;
  onAttach: () => void;
}) {
  const items = [
    { title: "Какие обязательства не выполнены?", hint: "Ответ по всем разобранным встречам", run: () => onAsk("Какие обязательства сейчас открыты и у кого?") },
    { title: "Что решили по «Альфа-Ритейл»?", hint: "Поиск по встречам с источниками", run: () => onAsk("Что мы решили по «Альфа-Ритейл» и что осталось открытым?") },
    {
      title: "Напомни мне в пятницу…",
      hint: "Задача с напоминанием",
      run: () => onDraft("Напомни мне в пятницу позвонить поставщику краски"),
    },
    { title: "Разобрать пример встречи", hint: "Совещание руководителей Photoprint", run: onSample },
  ];
  return (
    <div className="chat-empty">
      <h1 className="chat-empty__title">
        {greeting()} <span>Чем помочь?</span>
      </h1>
      <p className="chat-empty__date">{formatToday()}</p>
      <div className="suggestions">
        {items.map((s) => (
          <button key={s.title} className="suggestion" onClick={s.run}>
            <span className="suggestion__title">{s.title}</span>
            <span className="suggestion__hint">{s.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text, transcript }: { text: string; transcript: boolean }) {
  if (!transcript) return <div className="msg-user">{text}</div>;
  const lines = text.split("\n").filter((l) => l.trim()).length;
  return (
    <details className="msg-transcript">
      <summary>
        <FileText size={16} /> Расшифровка встречи
        <span className="msg-transcript__meta">· {pluralize(lines, ["строка", "строки", "строк"])}</span>
      </summary>
      <pre>{text}</pre>
    </details>
  );
}

function Message({ m }: { m: ChatMessage }) {
  if (m.role === "user") return <UserBubble text={m.text} transcript={m.kind === "transcript"} />;
  return (
    <div className="msg-assistant">
      <BrandMark size={28} />
      <div className="msg-assistant__body">
        {m.kind === "meeting_report" && m.reportId ? (
          <MeetingCard reportId={m.reportId} />
        ) : (
          <>
            {m.text}
            {m.meta && <MetaBlock meta={m.meta} />}
          </>
        )}
      </div>
    </div>
  );
}

/** What the assistant based its answer on, and what it did. */
function MetaBlock({ meta }: { meta: MessageMeta }) {
  return (
    <div className="meta">
      {meta.createdTasks?.map((t) => <TaskCard key={t.id} task={t} />)}
      {meta.completedTasks?.map((t) => <TaskCard key={t.id} task={t} completed />)}
      {meta.sources && meta.sources.length > 0 && (
        <div className="sources">
          <span className="sources__label">Источники · не проверено:</span>
          {meta.sources.map((s) => (
            <a key={s.reportId} className="source" href={`#/report/${s.reportId}`}>
              <FileText size={13} /> {s.title}
              <span className="source__date">{formatDateTime(s.createdAt)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
