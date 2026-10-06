/**
 * Workspace pronunciation lexicon for Voice Studio.
 * Grapheme → spoken alias applied before TTS. Not forced alignment / IPA engines.
 */

export type Lexeme = {
  grapheme: string;
  alias: string;
  language?: string | null;
};

export function applyPronunciationLexicon(text: string, lexemes: Lexeme[]): string {
  let out = text;
  const sorted = [...lexemes].sort((a, b) => b.grapheme.length - a.grapheme.length);
  for (const lex of sorted) {
    const g = lex.grapheme?.trim;
    const alias = lex.alias?.trim;
    if (!g || !alias) continue;
    const escaped = g.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    out = out.replace(re, alias);
  }
  return out;
}
