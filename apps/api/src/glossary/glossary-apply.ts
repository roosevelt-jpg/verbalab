export type GlossaryTermLike = {
  sourceTerm: string;
  targetTerm: string;
  caseSensitive: boolean;
  wholeWord: boolean;
};

export type GlossaryProtectResult = {
  text: string;
  replacements: Array<{ placeholder: string; targetTerm: string; sourceTerm: string }>;
};

/** Escape RegExp metacharacters. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTermPattern(term: GlossaryTermLike): RegExp {
  const escaped = escapeRegExp(term.sourceTerm);
  const body = term.wholeWord
    ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`
    : escaped;
  return new RegExp(body, term.caseSensitive ? 'gu' : 'giu');
}

/**
 * Protect glossary source terms with opaque placeholders so MT leaves them alone,
 * then restore to target terms after translation.
 */
export function protectGlossaryTerms(
  text: string,
  terms: GlossaryTermLike[],
  startIndex = 0,
): GlossaryProtectResult {
  const sorted = [...terms].sort((a, b) => b.sourceTerm.length - a.sourceTerm.length);
  const replacements: GlossaryProtectResult['replacements'] = [];
  let output = text;

  for (const term of sorted) {
    if (!term.sourceTerm.trim()) continue;
    const placeholder = `⟦VL${startIndex + replacements.length}⟧`;
    const pattern = buildTermPattern(term);
    if (!pattern.test(output)) continue;
    // reset lastIndex after test()
    pattern.lastIndex = 0;
    output = output.replace(pattern, placeholder);
    replacements.push({
      placeholder,
      targetTerm: term.targetTerm,
      sourceTerm: term.sourceTerm,
    });
  }

  return { text: output, replacements };
}

export function restoreGlossaryPlaceholders(
  translated: string,
  replacements: GlossaryProtectResult['replacements'],
): string {
  let output = translated;
  for (const item of replacements) {
    output = output.split(item.placeholder).join(item.targetTerm);
  }
  return output;
}

/** Safety net if the provider still emitted a source term. */
export function enforceGlossaryTargets(text: string, terms: GlossaryTermLike[]): string {
  const sorted = [...terms].sort((a, b) => b.sourceTerm.length - a.sourceTerm.length);
  let output = text;
  for (const term of sorted) {
    if (!term.sourceTerm.trim()) continue;
    const pattern = buildTermPattern(term);
    output = output.replace(pattern, term.targetTerm);
  }
  return output;
}
