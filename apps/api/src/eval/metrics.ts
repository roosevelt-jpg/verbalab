/** Reference-based MT metrics for the VL-100 harness (not heuristic QE). */

export function normalizeForEval(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance on Unicode code points. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Character-level similarity in [0, 1]. */
export function charSimilarity(hypothesis: string, reference: string): number {
  const a = normalizeForEval(hypothesis);
  const b = normalizeForEval(reference);
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export function exactMatch(hypothesis: string, reference: string): boolean {
  return normalizeForEval(hypothesis) === normalizeForEval(reference);
}

export type SegmentScore = {
  id: string;
  exact: boolean;
  charSimilarity: number;
};

export type PairScoreSummary = {
  sourceLang: string;
  targetLang: string;
  segmentCount: number;
  exactMatchRate: number;
  meanCharSimilarity: number;
  segments: SegmentScore[];
};

export function scorePair(input: {
  sourceLang: string;
  targetLang: string;
  rows: { id: string; hypothesis: string; reference: string }[];
}): PairScoreSummary {
  const segments = input.rows.map((row) => ({
    id: row.id,
    exact: exactMatch(row.hypothesis, row.reference),
    charSimilarity: charSimilarity(row.hypothesis, row.reference),
  }));
  const exactCount = segments.filter((s) => s.exact).length;
  const meanChar =
    segments.length === 0
      ? 0
      : segments.reduce((sum, s) => sum + s.charSimilarity, 0) / segments.length;

  return {
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    segmentCount: segments.length,
    exactMatchRate: segments.length ? exactCount / segments.length : 0,
    meanCharSimilarity: meanChar,
    segments,
  };
}
