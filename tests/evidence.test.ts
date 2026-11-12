import assert from "node:assert/strict";
import { test } from "node:test";
import { quoteAppearsIn, verifyQuote } from "../server/analysis/evidence.ts";
import { TRANSCRIPT } from "./helpers.ts";

test("exact quote is verified", () => {
  const r = verifyQuote(TRANSCRIPT, "Я проведу инвентаризацию бумаги и подготовлю отчёт до пятницы.");
  assert.equal(r.evidence_status, "verified");
  assert.ok(r.evidence_quote);
});

test("differences in case, ё/е, guillemets and whitespace are tolerated", () => {
  assert.ok(quoteAppearsIn(TRANSCRIPT, "«пересмотреть   всю систему складского УЧЕТА»"));
});

test("quote with ellipsis matches fragments in order", () => {
  assert.ok(quoteAppearsIn(TRANSCRIPT, "я возьму на себя … выгрузки остатков"));
  assert.equal(quoteAppearsIn(TRANSCRIPT, "выгрузки остатков … я возьму на себя"), false);
});

test("paraphrased or invented quote is rejected and removed", () => {
  const r = verifyQuote(TRANSCRIPT, "Андрей обещал сделать инвентаризацию к понедельнику");
  assert.deepEqual(r, { evidence_quote: null, evidence_status: "unavailable" });
});

test("empty, null and too-short quotes are unavailable", () => {
  assert.equal(verifyQuote(TRANSCRIPT, null).evidence_status, "unavailable");
  assert.equal(verifyQuote(TRANSCRIPT, "   ").evidence_status, "unavailable");
  assert.equal(verifyQuote(TRANSCRIPT, "я").evidence_status, "unavailable");
});
