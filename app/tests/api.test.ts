import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import type { ReportDetail, ReportSummary } from "../shared/report.ts";
import { createApp } from "../server/app.ts";
import { LlmError } from "../server/llm/types.ts";
import { sanitizeJsonSchema } from "../server/llm/openrouter.ts";
import { SqliteRepository } from "../server/storage/sqlite.ts";
import { FakeLlm, TRANSCRIPT, validModelReport } from "./helpers.ts";

const repo = new SqliteRepository(":memory:");
const llm = new FakeLlm(validModelReport(), new LlmError("upstream", "boom", 401));
let server: Server;
let base = "";

before(async () => {
  const app = createApp({ repo, llm, limits: { minTranscriptChars: 50, maxTranscriptChars: 5000 }, log: () => {} });
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.close();
  repo.close();
});

const post = (body: unknown) =>
  fetch(`${base}/api/analyses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("health reports the configured model", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.deepEqual(await res.json(), { ok: true, model: "fake/model" });
});

test("too-short transcript is rejected with a Russian message", async () => {
  const res = await post({ transcript: "коротко" });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: { message: string } };
  assert.match(body.error.message, /слишком короткая/);
});

test("successful analysis is stored as pending_review and retrievable", async () => {
  const res = await post({ transcript: TRANSCRIPT });
  assert.equal(res.status, 201);
  const detail = (await res.json()) as ReportDetail;
  assert.equal(detail.status, "pending_review");
  assert.equal(detail.title, "Совещание по складу");
  assert.equal(detail.usage.totalTokens, 150);
  assert.equal(detail.report?.commitments.length, 2);

  const again = (await (await fetch(`${base}/api/analyses/${detail.id}`)).json()) as ReportDetail;
  assert.equal(again.id, detail.id);
  assert.equal(again.transcript, TRANSCRIPT);
});

test("provider auth failure returns 502 and is stored as failed", async () => {
  const res = await post({ transcript: TRANSCRIPT, title: "Неудачная встреча" });
  assert.equal(res.status, 502);
  const body = (await res.json()) as { error: { code: string } };
  assert.equal(body.error.code, "auth");

  const list = (await (await fetch(`${base}/api/analyses`)).json()) as ReportSummary[];
  assert.equal(list.length, 2);
  assert.equal(list[0]?.status, "failed");

  // The raw upstream error is stored, but never returned to the browser.
  const failed = (await (await fetch(`${base}/api/analyses/${list[0]?.id}`)).json()) as ReportDetail;
  assert.equal(failed.status, "failed");
  assert.equal(failed.errorMessage, null);
  assert.equal(repo.getReport(list[0]!.id)?.errorMessage, "boom");
  assert.equal(list[0]?.counts, null);
  assert.deepEqual(list[1]?.counts, { decisions: 1, commitments: 2, clarifications: 1, openQuestions: 0 });
});

test("unknown report id returns 404", async () => {
  const res = await fetch(`${base}/api/analyses/does-not-exist`);
  assert.equal(res.status, 404);
});

test("schema sanitizer removes keywords some providers reject but keeps structure", () => {
  const s = sanitizeJsonSchema({
    $schema: "x",
    type: "object",
    properties: { minLength: { type: "string", minLength: 1 } },
    required: ["minLength"],
  }) as Record<string, any>;
  assert.equal(s.$schema, undefined);
  assert.deepEqual(s.properties.minLength, { type: "string" }); // property *named* minLength survives
  assert.deepEqual(s.required, ["minLength"]);
});
