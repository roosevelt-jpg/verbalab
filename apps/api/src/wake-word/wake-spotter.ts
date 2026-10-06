export type SpotHit = {
  phrase: string;
  kind: string;
  start: number;
  end: number;
  matched: string;
};

/** Normalize for spotting (lowercase, collapse whitespace). */
export function normalizeSpotText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Spot phrases in text with word-boundary-ish matching.
 * Multi-word phrases match contiguous normalized tokens.
 */
export function spotPhrases(
  text: string,
  phrases: Array<{ phrase: string; kind: string }>,
): SpotHit[] {
  const normalized = normalizeSpotText(text);
  if (!normalized || !phrases.length) return [];

  const hits: SpotHit[] = [];
  const seen = new Set<string>();

  for (const item of phrases) {
    const phrase = normalizeSpotText(item.phrase);
    if (!phrase) continue;
    const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const matched = match[0].trim();
      const start = match.index + (match[0].startsWith(' ') ? 1 : 0);
      const end = start + matched.length;
      const key = `${item.kind}:${phrase}:${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        phrase: item.phrase,
        kind: item.kind,
        start,
        end,
        matched,
      });
    }
  }

  return hits.sort((a, b) => a.start - b.start);
}

export function hasWakeHit(hits: SpotHit[]): boolean {
  return hits.some((h) => h.kind === 'wake_word');
}
