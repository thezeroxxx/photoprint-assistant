/**
 * Verifies that an evidence quote really appears in the transcript.
 * A quote that cannot be found is never shown as a quotation (PO rule: never fabricate quotes).
 */
import type { EvidenceStatus } from "../../shared/report.ts";

/** Normalizes text so that harmless differences (quotes, dashes, ё, case, whitespace) do not matter. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»“”„‟"'‘’‚`]/g, "")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trims punctuation that models often add around a quote. */
function trimEdges(text: string): string {
  return text.replace(/^[\s.,;:!?…-]+|[\s.,;:!?…-]+$/g, "");
}

/**
 * Returns true if the quote occurs in the transcript. Quotes with an ellipsis ("…" or "...")
 * are split into fragments that must all occur, in order.
 */
export function quoteAppearsIn(transcript: string, quote: string): boolean {
  const hay = normalizeForMatch(transcript);
  const fragments = quote
    .split(/\.\.\.|…/)
    .map((f) => trimEdges(normalizeForMatch(f)))
    .filter((f) => f.length > 0);
  if (fragments.length === 0) return false;
  // Require at least some substance so that tiny fragments cannot "verify" by accident.
  if (fragments.reduce((n, f) => n + f.length, 0) < 8) return false;
  let from = 0;
  for (const fragment of fragments) {
    const at = hay.indexOf(fragment, from);
    if (at === -1) return false;
    from = at + fragment.length;
  }
  return true;
}

export function verifyQuote(
  transcript: string,
  quote: string | null,
): { evidence_quote: string | null; evidence_status: EvidenceStatus } {
  if (!quote || !quote.trim()) return { evidence_quote: null, evidence_status: "unavailable" };
  const cleaned = quote.trim().replace(/^[«"“„']+|[»"”'‟]+$/g, "").trim();
  return quoteAppearsIn(transcript, cleaned)
    ? { evidence_quote: cleaned, evidence_status: "verified" }
    : { evidence_quote: null, evidence_status: "unavailable" };
}
