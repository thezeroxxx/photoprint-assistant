/**
 * Chat helpers: decide whether a message is a meeting transcript, and derive a fallback chat title.
 * Assistant answers themselves are produced in assistant.ts.
 */

/**
 * Heuristic: a transcript is a long text with several "Speaker: text" lines.
 * The attach button bypasses this check ("transcript" mode).
 */
export function looksLikeTranscript(text: string): boolean {
  if (text.length < 300) return false;
  const speakerLines = text.split("\n").filter((line) => /^[^\n:]{2,60}:\s+\S/.test(line.trim()));
  return speakerLines.length >= 3;
}

/** Short chat title from the first user message (used when no better title exists). */
export function titleFromText(text: string): string {
  const firstLine = text.trim().split("\n")[0] ?? "";
  const clean = firstLine.replace(/\s+/g, " ").trim();
  if (!clean) return "Новый чат";
  return clean.length > 48 ? `${clean.slice(0, 47).trimEnd()}…` : clean;
}
