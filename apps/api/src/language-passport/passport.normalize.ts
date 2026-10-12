/**
 * Unicode-safe normalization for Passport matching.
 * Preserves diacritics/tones (NFC). Matching is whole-token / whole-phrase —
 * never silent substring substitution inside unrelated words.
 */

export function normalizeSourceForm(input: string): string {
  return input.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function entryKeyFor(type: string, sourceForm: string, languageVariety: string): string {
  const form = normalizeSourceForm(sourceForm).toLocaleLowerCase('en');
  const variety = languageVariety.trim().toLowerCase() || 'any';
  return `${type}::${variety}::${form}`;
}

/** Find whole-phrase matches; reject interior substring hits. */
export function findPhraseSpans(
  text: string,
  phrase: string,
): Array<{ start: number; end: number; matched: string }> {
  const hay = text.normalize('NFC');
  const needle = normalizeSourceForm(phrase);
  if (!needle) return [];

  const spans: Array<{ start: number; end: number; matched: string }> = [];
  const lowerHay = hay.toLocaleLowerCase('en');
  const lowerNeedle = needle.toLocaleLowerCase('en');
  let from = 0;
  while (from <= lowerHay.length - lowerNeedle.length) {
    const idx = lowerHay.indexOf(lowerNeedle, from);
    if (idx < 0) break;
    const end = idx + lowerNeedle.length;
    const before = idx === 0 ? '' : hay[idx - 1]!;
    const after = end >= hay.length ? '' : hay[end]!;
    const boundaryBefore = idx === 0 || !/\p{L}|\p{N}/u.test(before);
    const boundaryAfter = end >= hay.length || !/\p{L}|\p{N}/u.test(after);
    if (boundaryBefore && boundaryAfter) {
      spans.push({ start: idx, end, matched: hay.slice(idx, end) });
    }
    from = idx + Math.max(1, lowerNeedle.length);
  }
  return spans;
}

export function contextsCompatible(
  entryCtx: Record<string, unknown> | null | undefined,
  taskCtx: Record<string, unknown> | null | undefined,
): { ok: boolean; reason?: string } {
  const entry = entryCtx ?? {};
  const task = taskCtx ?? {};

  const entryProduct = typeof entry.product === 'string' ? entry.product.toLowerCase() : '';
  const taskProduct = typeof task.product === 'string' ? task.product.toLowerCase() : '';
  if (entryProduct && taskProduct && entryProduct !== taskProduct) {
    return { ok: false, reason: `context_product_mismatch:${entryProduct}!=${taskProduct}` };
  }
  if (entryProduct && !taskProduct) {
    return { ok: false, reason: 'context_product_unknown' };
  }

  const entryCategory = typeof entry.category === 'string' ? entry.category.toLowerCase() : '';
  const taskCategory = typeof task.category === 'string' ? task.category.toLowerCase() : '';
  if (entryCategory && taskCategory && entryCategory !== taskCategory) {
    return { ok: false, reason: `context_category_mismatch` };
  }

  const entryBiz = typeof entry.businessScopeId === 'string' ? entry.businessScopeId : '';
  const taskBiz = typeof task.businessScopeId === 'string' ? task.businessScopeId : '';
  if (entryBiz && taskBiz && entryBiz !== taskBiz) {
    return { ok: false, reason: 'context_business_mismatch' };
  }
  if (entryBiz && !taskBiz) {
    return { ok: false, reason: 'context_business_unknown' };
  }

  const validUntil = typeof entry.validUntil === 'string' ? Date.parse(entry.validUntil) : NaN;
  if (Number.isFinite(validUntil) && Date.now() > validUntil) {
    return { ok: false, reason: 'context_expired' };
  }
  const validFrom = typeof entry.validFrom === 'string' ? Date.parse(entry.validFrom) : NaN;
  if (Number.isFinite(validFrom) && Date.now() < validFrom) {
    return { ok: false, reason: 'context_not_yet_valid' };
  }

  return { ok: true };
}

export function decimalSafeQuantity(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return trimmed;
}
