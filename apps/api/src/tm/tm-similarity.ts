import { normalizeTmSegment } from './tm-hash';

export type TmScope = 'workspace' | 'enterprise' | 'shared' | 'project';

export function isTmScope(value: string): value is TmScope {
  return value === 'workspace' || value === 'enterprise' || value === 'shared' || value === 'project';
}

/** Character bigrams for Dice coefficient. */
function bigrams(text: string): Map<string, number> {
  const normalized = normalizeTmSegment(text).toLowerCase;
  const map = new Map<string, number>;
  if (normalized.length < 2) {
    if (normalized) map.set(normalized, 1);
    return map;
  }
  for (let i = 0; i < normalized.length - 1; i++) {
    const g = normalized.slice(i, i + 2);
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return map;
}

/** Dice coefficient on character bigrams (0–1). */
export function lexicalSimilarity(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  let sizeA = 0;
  let sizeB = 0;
  for (const [, n] of A) sizeA += n;
  for (const [, n] of B) sizeB += n;
  for (const [g, n] of A) {
    const m = B.get(g);
    if (m) intersection += Math.min(n, m);
  }
  return (2 * intersection) / (sizeA + sizeB);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
