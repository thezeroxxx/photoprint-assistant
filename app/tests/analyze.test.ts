import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeMeeting } from "../server/analysis/analyzeMeeting.ts";
import { LlmError } from "../server/llm/types.ts";
import { FakeLlm, TRANSCRIPT, validModelReport } from "./helpers.ts";

test("valid output becomes a report with all six sections and verified quotes", async () => {
  const llm = new FakeLlm(validModelReport());
  const r = await analyzeMeeting(llm, TRANSCRIPT, null);
  assert.equal(r.attempts, 1);
  const rep = r.report;
  for (const key of ["summary", "decisions", "commitments", "needs_clarification", "open_questions", "suggested_next_steps"]) {
    assert.ok(key in rep, `missing section ${key}`);
  }
  assert.equal(rep.commitments[0]?.evidence_status, "verified");
  // Quote wrapped in guillemets is still verified, and the guillemets are stripped.
  assert.equal(rep.commitments[1]?.evidence_status, "verified");
  assert.ok(!rep.commitments[1]?.evidence_quote?.startsWith("«"));
});

test("accepted commitment without deadline stays a confirmed commitment with null deadline", async () => {
  const r = await analyzeMeeting(new FakeLlm(validModelReport()), TRANSCRIPT, null);
  const c = r.report.commitments.find((x) => x.owner === "Сергей Лебедев");
  assert.ok(c);
  assert.equal(c.deadline, null);
});

test("placeholder deadline text is normalized to null", async () => {
  const base = validModelReport();
  base.commitments[0]!.deadline = "Не указан";
  const r = await analyzeMeeting(new FakeLlm(base), TRANSCRIPT, null);
  assert.equal(r.report.commitments[0]?.deadline, null);
});

test("commitment without an identifiable owner moves to Needs Clarification", async () => {
  const base = validModelReport();
  base.commitments[0]!.owner = "не указан";
  const r = await analyzeMeeting(new FakeLlm(base), TRANSCRIPT, null);
  assert.equal(r.report.commitments.length, 1);
  assert.ok(r.report.needs_clarification.some((n) => n.missing.includes("owner") && n.statement.includes("инвентаризацию")));
});

test("fabricated quote is removed and marked unavailable", async () => {
  const base = validModelReport();
  base.commitments[0]!.evidence_quote = "Андрей твёрдо пообещал всё сделать к понедельнику";
  const r = await analyzeMeeting(new FakeLlm(base), TRANSCRIPT, null);
  assert.equal(r.report.commitments[0]?.evidence_quote, null);
  assert.equal(r.report.commitments[0]?.evidence_status, "unavailable");
});

test("invalid output is retried once, then succeeds", async () => {
  const llm = new FakeLlm({ wrong: "shape" }, validModelReport());
  const r = await analyzeMeeting(llm, TRANSCRIPT, null);
  assert.equal(r.attempts, 2);
  assert.equal(llm.calls.length, 2);
  assert.equal(r.usage.totalTokens, 300); // usage of both attempts is counted
});

test("invalid output twice fails with invalid_output", async () => {
  const llm = new FakeLlm({ wrong: 1 }, { wrong: 2 });
  await assert.rejects(analyzeMeeting(llm, TRANSCRIPT, null), (e: unknown) => e instanceof LlmError && e.kind === "invalid_output");
});

test("timeout is not retried", async () => {
  const llm = new FakeLlm(new LlmError("timeout", "slow"), validModelReport());
  await assert.rejects(analyzeMeeting(llm, TRANSCRIPT, null), (e: unknown) => e instanceof LlmError && e.kind === "timeout");
  assert.equal(llm.calls.length, 1);
});

test("the model receives a strict JSON schema with all sections required", async () => {
  const llm = new FakeLlm(validModelReport());
  await analyzeMeeting(llm, TRANSCRIPT, "Тест");
  const schema = llm.calls[0]!.jsonSchema as { required: string[]; additionalProperties: boolean };
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, [
    "meeting_title", "summary", "decisions", "commitments", "needs_clarification", "open_questions", "suggested_next_steps",
  ]);
  assert.ok(llm.calls[0]!.user.includes("Тест"));
});
