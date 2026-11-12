# Photoprint AI Executive Assistant

A conversation-first AI assistant for the CEO of Photoprint, a printing and manufacturing company. It turns meeting transcripts into structured reports, remembers decisions and commitments, answers questions from that memory with sources, creates tasks and reminders from plain requests, and accepts voice input.

> The interface is in Russian. This README is in English for developers.

## What it does

| Capability | How it works |
|---|---|
| **Meeting analysis** | Paste a transcript into the chat, or attach a `.txt` file. The assistant returns a summary card and a full report with six sections: summary, key decisions, confirmed commitments, items needing clarification, open questions, and suggested next steps. |
| **Answers from your data** | Ask "Какие обязательства не выполнены?" or "Что решили по «Альфа-Ритейл»?". Answers come only from stored meetings and tasks, cite the meetings used, and say so when the data has no answer. |
| **Tasks and reminders** | "Напомни мне в пятницу позвонить поставщику" creates a task with a reminder. "Я позвонил поставщику" marks it done. Reminders appear in the app and as browser notifications while the app is open. |
| **Voice** | Tap the microphone, speak, tap again. Whisper transcribes the speech and the text is sent immediately. |
| **Обязательства page** | Your own tasks plus all commitments extracted from meetings, grouped by meeting. |

### Trust rules enforced in code
- Quotes are shown only if they appear verbatim in the transcript; otherwise "Цитата недоступна".
- Deadlines are never invented; a missing one is shown as "Срок не указан".
- A vague statement is never turned into a confirmed commitment; it goes to "Требуют уточнения" with what is missing.
- AI-extracted data is labeled "Не проверено".
- Citations and actions returned by the model are validated by the server before use. Meeting text is treated as data, never as instructions.

## Quick start

Requirements: **Node.js 22.13+** (developed on Node 26) and an **[OpenRouter](https://openrouter.ai) API key**.

```bash
cd app
npm install
cp .env.example .env   # first time only — this overwrites an existing .env
```

Open `app/.env` and set `OPENROUTER_API_KEY`. Then:

```bash
npm run seed:demo   # optional: loads 6 analyzed demo meetings (~$0.01, safe to re-run)
npm run dev         # web app on http://localhost:5173, API on http://127.0.0.1:3000
```

Use `http://localhost:…` in the browser: microphone access works only on `localhost` or `https`.

### Commands (run in `app/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Development: Vite and the API with auto-reload |
| `npm run build && npm start` | Production build, served on a single port (3000) |
| `npm run typecheck` | TypeScript checks for the server and the client |
| `npm test` | Test suite (Node's built-in test runner) |
| `npm run seed:demo` | Load and analyze the demo meetings in `samples/` (idempotent) |
| `npm run compare` | Compare models on the sample transcript against an answer key (~$0.01) |

### Configuration (`app/.env`)

| Variable | Default | Meaning |
|---|---|---|
| `OPENROUTER_API_KEY` | — | Required. Server-side only; never sent to the browser. |
| `OPENROUTER_MODEL` | `anthropic/claude-haiku-5.5` | Chat and analysis model (any OpenRouter model with structured JSON output) |
| `STT_MODEL` | `openai/whisper-large-v3` | Speech-to-text model |
| `STT_LANGUAGE` | `ru` | Speech language |
| `HOST` | `127.0.0.1` | Set `0.0.0.0` to reach the API from other devices (no login — trusted networks only) |
| `PORT` | `3000` | API port |
| `DB_PATH` | `data/app.db` | SQLite database file |
| `LLM_TIMEOUT_MS`, `LLM_MAX_TOKENS`, `MAX_TRANSCRIPT_CHARS`, `MAX_AUDIO_MB` | see `.env.example` | Limits |

For a phone on the same Wi-Fi, set `HOST=0.0.0.0` and start with `LAN=1 npm run dev`.

## Architecture

```
React + Vite (client)  ──/api──▶  Express (server)  ──▶  OpenRouter (chat model, Whisper)
                                        │
                                        └──▶  SQLite (node:sqlite)
```

The business logic depends only on interfaces, so providers and storage can be replaced without rewriting it:

- `LlmClient` (`server/llm/`): structured JSON generation. Implemented with OpenRouter.
- `SpeechToText` (`server/stt/`): transcription. Implemented with Whisper via OpenRouter.
- `Repository` (`server/storage/`): persistence. Implemented with SQLite.

```
.
├── PROJECT_BRIEF.md          Business requirements (source of truth)
├── docs/product-vision.md    Approved product vision
└── app/
    ├── client/src/           React UI: views/ (chat, meetings, report, tasks), components/, lib/, styles/
    ├── server/
    │   ├── app.ts            HTTP routes, validation, error mapping
    │   ├── analysis/         Meeting analysis, quote verification, assistant turn (answers + actions)
    │   ├── llm/  stt/        Model and speech-to-text clients
    │   └── storage/          Repository interface and SQLite implementation
    ├── shared/               Types shared by client and server (report, chat, tasks)
    ├── samples/              Demo transcripts and the answer key
    ├── scripts/              seed-demo, compare-models
    └── tests/                Unit and API tests
```

### API

| Method and path | Purpose |
|---|---|
| `POST /api/chat` | Send a message; a transcript is analyzed, anything else gets a grounded answer and optional actions |
| `GET /api/chats`, `GET /api/chats/:id` | Chat history |
| `POST /api/transcribe` | Raw audio in, recognized text out (nothing is stored) |
| `GET /api/analyses`, `GET /api/analyses/:id` | Meeting reports |
| `GET /api/tasks`, `PATCH /api/tasks/:id` | Tasks: list, complete, mark a reminder as shown |
| `GET /api/commitments` | All commitments from meeting reports |
| `GET /api/health` | Status and configured model |

## Known limitations

- **Single user.** There is no login; the API listens on `127.0.0.1` by default.
- **Reminders fire only while the app is open** in a browser tab. There is no push service yet.
- **No review step.** Answers use AI-extracted meeting data marked "не проверено". Confirming or correcting items is not built yet.
- **Whole-memory answers.** Every question sends all stored meetings to the model. That works at the current scale, but would need search at hundreds of meetings.
- **Not built yet:** the Yandex Calendar integration and daily planning (designed, next on the roadmap); audio upload of whole meetings; speaker diarization.

## Costs (approximate, `claude-haiku-5.5`)

- **Meeting analysis:** about $0.002–0.003 per meeting.
- **Chat answer:** about $0.003.
- **Whisper:** about $0.03 per hour of audio.

## Security

- The API key is kept in `app/.env`, which is git-ignored, and used only on the server.
- In development, the Vite server can only read the folders the client needs, so `data/` and `.env` are never served.
- Raw provider errors stay in server logs; users see short Russian messages.
