import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import type { ChatDetail, ChatSummary, SendMessageResponse } from "../shared/chat.ts";
import { looksLikeTranscript, titleFromText } from "../server/analysis/chat.ts";
import { createApp } from "../server/app.ts";
import { LlmError } from "../server/llm/types.ts";
import { SqliteRepository } from "../server/storage/sqlite.ts";
import { FakeLlm, FakeStt, validModelReport } from "./helpers.ts";

const SAMPLE = readFileSync("samples/demo-transcript-ru.txt", "utf8");

test("transcript detection: sample is a transcript, a question is not", () => {
  assert.equal(looksLikeTranscript(SAMPLE), true);
  assert.equal(looksLikeTranscript("Какие обязательства не выполнены?"), false);
  assert.equal(looksLikeTranscript("Иван: привет\nПётр: привет"), false); // too short
});

test("title from text is trimmed to one short line", () => {
  assert.equal(titleFromText("  Подготовь письмо поставщику\nвторая строка"), "Подготовь письмо поставщику");
  assert.ok(titleFromText("а".repeat(100)).endsWith("…"));
  assert.equal(titleFromText("   "), "Новый чат");
});

const repo = new SqliteRepository(":memory:");
const llm = new FakeLlm(
  { reply: "Привет! Пришлите расшифровку встречи.", chat_title: "Знакомство", sources: [], actions: [] }, // 1: plain reply
  new LlmError("upstream", "boom", 500), // 2: failed reply
  { reply: "Готово.", chat_title: "Повтор", sources: [], actions: [] }, // 3: retry succeeds
  validModelReport(), // 4: transcript analysis
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

const send = (body: unknown) =>
  fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

let chatId = "";

test("first message creates a chat with an AI title and stores both messages", async () => {
  const res = await send({ text: "Привет" });
  assert.equal(res.status, 201);
  const body = (await res.json()) as SendMessageResponse;
  chatId = body.chat.id;
  assert.equal(body.chat.title, "Знакомство");
  assert.deepEqual(body.added.map((m) => [m.role, m.kind]), [["user", "text"], ["assistant", "text"]]);
});

test("failed reply stores nothing, so a retry does not duplicate messages", async () => {
  const failed = await send({ chatId, text: "Ещё вопрос" });
  assert.equal(failed.status, 502);
  assert.equal(((await (await fetch(`${base}/api/chats/${chatId}`)).json()) as ChatDetail).messages.length, 2);

  const retry = await send({ chatId, text: "Ещё вопрос" });
  assert.equal(retry.status, 201);
  const chat = (await (await fetch(`${base}/api/chats/${chatId}`)).json()) as ChatDetail;
  assert.equal(chat.messages.length, 4);
  assert.equal(chat.title, "Знакомство"); // existing title is kept
});

test("a pasted transcript is analyzed and answered with a meeting report card", async () => {
  const res = await send({ text: SAMPLE });
  assert.equal(res.status, 201);
  const body = (await res.json()) as SendMessageResponse;
  assert.equal(body.chat.title, "Совещание по складу");
  const [user, assistant] = body.added;
  assert.equal(user?.kind, "transcript");
  assert.equal(assistant?.kind, "meeting_report");
  assert.ok(assistant?.reportId);
  const report = await fetch(`${base}/api/analyses/${assistant!.reportId}`);
  assert.equal(report.status, 200);
});

test("chat list is newest first; unknown chat is 404; empty text is 400", async () => {
  const list = (await (await fetch(`${base}/api/chats`)).json()) as ChatSummary[];
  assert.equal(list.length, 2);
  assert.equal(list[0]?.title, "Совещание по складу");
  assert.equal((await fetch(`${base}/api/chats/nope`)).status, 404);
  assert.equal((await send({ chatId: "nope", text: "x" })).status, 404);
  assert.equal((await send({ text: "   " })).status, 400);
});
