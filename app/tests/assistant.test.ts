import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import type { SendMessageResponse } from "../shared/chat.ts";
import type { MeetingCommitment, Task } from "../shared/tasks.ts";
import { calendarContext } from "../server/analysis/assistant.ts";
import { createApp } from "../server/app.ts";
import { SqliteRepository } from "../server/storage/sqlite.ts";
import { FakeLlm, FakeStt, TRANSCRIPT, validModelReport } from "./helpers.ts";

test("calendar context resolves weekdays for relative dates", () => {
  const ctx = calendarContext(new Date(2026, 10, 12, 19, 5)); // Thu 12 Nov 2026
  assert.match(ctx, /Сейчас: четверг, 2026-11-12, 19:05/);
  assert.match(ctx, /2026-11-13 — пятница \(завтра\)/);
});

const repo = new SqliteRepository(":memory:");
const llm = new FakeLlm(
  validModelReport(), // 1: seed a meeting via /api/analyses
  {
    // 2: grounded answer citing M1 plus an invented M9 (must be dropped)
    reply: "Андрей Ковалёв обещал провести инвентаризацию до пятницы.",
    chat_title: "Инвентаризация",
    sources: ["M1", "M9"],
    actions: [],
  },
  {
    // 3: create a reminder; plus an invalid action (no title) that must be skipped
    reply: "Готово: напомню в пятницу в 09:00.",
    chat_title: "Напоминание",
    sources: [],
    actions: [
      { type: "create_task", title: "Позвонить поставщику краски", due_date: null, remind_at: "2026-11-13T09:00", task_ref: null },
      { type: "create_task", title: "  ", due_date: "2026-11-13", remind_at: null, task_ref: null },
      { type: "create_task", title: "Кривая дата", due_date: "13.11.2026", remind_at: "завтра", task_ref: null },
    ],
  },
  {
    // 4: complete the first task; unknown ref is ignored
    reply: "Отметил как выполненную.",
    chat_title: "x",
    sources: [],
    actions: [
      { type: "complete_task", title: null, due_date: null, remind_at: null, task_ref: "T1" },
      { type: "complete_task", title: null, due_date: null, remind_at: null, task_ref: "T99" },
    ],
  },
);
let server: Server;
let base = "";
before(async () => {
  server = createApp({ repo, llm, stt: new FakeStt(), limits: { minTranscriptChars: 50, maxTranscriptChars: 60_000 }, log: () => {} }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.close();
  repo.close();
});
const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("answers cite only meetings that exist, and the model sees the stored data", async () => {
  assert.equal((await post("/api/analyses", { transcript: TRANSCRIPT })).status, 201);
  const res = await post("/api/chat", { text: "Что обещал Андрей?" });
  assert.equal(res.status, 201);
  const body = (await res.json()) as SendMessageResponse;
  const sources = body.added[1]?.meta?.sources ?? [];
  assert.equal(sources.length, 1);
  assert.equal(sources[0]?.title, "Совещание по складу");
  const prompt = llm.calls[1]!.user;
  assert.match(prompt, /\[M1\] «Совещание по складу»/);
  assert.match(prompt, /Андрей Ковалёв — Провести инвентаризацию бумаги и подготовить отчёт \(срок: до пятницы\)/);
});

let chatId = "";
test("a reminder request creates exactly one valid task; invalid actions are skipped", async () => {
  const res = await post("/api/chat", { text: "Напомни мне в пятницу позвонить поставщику краски" });
  assert.equal(res.status, 201);
  const body = (await res.json()) as SendMessageResponse;
  chatId = body.chat.id;
  const created = body.added[1]?.meta?.createdTasks ?? [];
  assert.equal(created.length, 2); // the blank title is skipped; bad dates become null
  assert.deepEqual(
    created.map((t) => [t.title, t.dueDate, t.remindAt]),
    [
      ["Позвонить поставщику краски", "2026-11-13", "2026-11-13T09:00"],
      ["Кривая дата", null, null],
    ],
  );
  assert.equal(created[0]?.chatId, chatId);
  assert.equal(body.chat.title, "Напоминание");
});

test("completing a task by reference updates it; unknown references are ignored", async () => {
  const tasks = (await (await fetch(`${base}/api/tasks`)).json()) as Task[];
  assert.equal(tasks.length, 2);
  const res = await post("/api/chat", { chatId, text: "Я позвонил поставщику" });
  const done = ((await res.json()) as SendMessageResponse).added[1]?.meta?.completedTasks ?? [];
  assert.equal(done.length, 1);
  assert.equal(done[0]?.status, "done");
  assert.match(llm.calls[3]!.user, /\[T1\] /);
});

test("tasks can be marked done or reminded via the API; commitments are listed from reports", async () => {
  const [task] = (await (await fetch(`${base}/api/tasks`)).json()) as Task[];
  const patched = await fetch(`${base}/api/tasks/${task!.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reminded: true }),
  });
  assert.ok(((await patched.json()) as Task).remindedAt);
  assert.equal((await fetch(`${base}/api/tasks/nope`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 404);

  const commitments = (await (await fetch(`${base}/api/commitments`)).json()) as MeetingCommitment[];
  assert.equal(commitments.length, 2);
  assert.equal(commitments[0]?.meetingTitle, "Совещание по складу");
});

test("internal record labels are removed from the reply text", async () => {
  const { stripRefs } = await import("../server/analysis/assistant.ts");
  assert.equal(stripRefs("Ирина — к 20 ноября (M6–M9). Андрей — до пятницы (M2), T1 тоже."), "Ирина — к 20 ноября. Андрей — до пятницы, тоже.");
  assert.equal(stripRefs("Модель M-образная, размер M"), "Модель M-образная, размер M");
});
