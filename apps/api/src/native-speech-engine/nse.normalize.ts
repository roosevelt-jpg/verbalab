import type { NseProsodySettings } from './nse.types';

/**
 * Target-language normalization + soft prosody hints.
 * Lexical tone marks are preserved (NFC). Rate/pitch only become textual
 * pacing cues — never pitch-shifts to fabricate regional coverage.
 */
export function normalizeForSynthesis(input: {
  text: string;
  targetLang?: string;
  prosody?: NseProsodySettings;
}): { text: string; applied: string[] } {
  const applied: string[] = [];
  let text = input.text.normalize('NFC').replace(/\s+/g, ' ').trim();

  // Decimal-safe currency spacing (do not rewrite values)
  const beforeCurrency = text;
  text = text.replace(/\b(GHS|USD|NGN|KES|EUR|GBP)\s*(\d)/gi, '$1 $2');
  if (text !== beforeCurrency) applied.push('currency_spacing');

  // Soft prosody via punctuation only (supported path)
  if (input.prosody?.emphasis && !/[.!?…]$/.test(text)) {
    text = `${text}.`;
    applied.push('emphasis_terminal_pause');
  }
  if (input.prosody?.rate === 'slow' || input.prosody?.rate === 'x-slow') {
    text = text.replace(/,\s*/g, ', ').replace(/\s*;\s*/g, '; ');
    applied.push('rate_pause_spacing');
  }
  if (input.prosody?.rate === 'fast' || input.prosody?.rate === 'x-fast') {
    applied.push('rate_requested_fast_engine_dependent');
  }
  if (input.prosody?.pitch && input.prosody.pitch !== 'medium') {
    applied.push(`pitch_${input.prosody.pitch}_engine_dependent`);
  }

  return { text, applied };
}

/** Apply grapheme→alias pronunciation dictionary (whole-token, boundary-safe). */
export function applyPronunciationAliases(
  text: string,
  aliases: Array<{ grapheme: string; alias: string }>,
): { text: string; applied: number } {
  let out = text.normalize('NFC');
  let applied = 0;
  const sorted = [...aliases].sort((a, b) => b.grapheme.length - a.grapheme.length);
  for (const { grapheme, alias } of sorted) {
    if (!grapheme || !alias) continue;
    const escaped = grapheme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<!\\p{L})(${escaped})(?!\\p{L})`, 'giu');
    const next = out.replace(re, alias);
    if (next !== out) {
      applied += 1;
      out = next;
    }
  }
  return { text: out, applied };
}
