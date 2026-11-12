import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "../server/app.ts";
import { LlmError } from "../server/llm/types.ts";
import { SqliteRepository } from "../server/storage/sqlite.ts";
import { formatFromContentType } from "../server/stt/types.ts";
import { FakeLlm, FakeStt } from "./helpers.ts";

test("browser recording types map to provider formats", () => {
  assert.equal(formatFromContentType("audio/webm;codecs=opus"), "webm");
  assert.equal(formatFromContentType("audio/mp4"), "m4a");
  assert.equal(formatFromContentType("audio/mpeg"), "mp3");
  assert.equal(formatFromContentType("audio/wav"), "wav");
  assert.equal(formatFromContentType("text/plain"), null);
});

const repo = new SqliteRepository(":memory:");
const stt = new FakeStt("Какие обязательства не выполнены?", "", new LlmError("upstream", "boom", 500));
let server: Server;
let base = "";
before(async () => {
  server = createApp({ repo, llm: new FakeLlm(), stt, limits: { minTranscriptChars: 50, maxTranscriptChars: 60_000 }, log: () => {} }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.close();
  repo.close();
});

const upload = (bytes: number, type = "audio/webm") =>
  fetch(`${base}/api/transcribe`, { method: "POST", headers: { "Content-Type": type }, body: new Uint8Array(bytes) });

test("recording is transcribed and returned as text", async () => {
  const res = await upload(5000);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { text: "Какие обязательства не выполнены?" });
  assert.deepEqual(stt.calls[0], { bytes: 5000, format: "webm" });
});

test("silence gives a Russian 'not recognized' error", async () => {
  const res = await upload(5000);
  assert.equal(res.status, 422);
  assert.match(((await res.json()) as { error: { message: string } }).error.message, /распознать/);
});

test("provider failure is mapped; bad type and tiny uploads are rejected", async () => {
  assert.equal((await upload(5000)).status, 502);
  assert.equal((await upload(5000, "text/plain")).status, 415);
  assert.equal((await upload(10)).status, 400);
});
