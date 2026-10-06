import { describe, expect, it } from 'vitest';
import { applyGrammarRules } from '../src/grammar/grammar-rules';

describe('grammar rules',  => {
  it('fixes spacing, repeats, misspellings, and I has',  => {
    const { corrected, issues } = applyGrammarRules('i has went to teh store store');
    expect(corrected).toContain('I have');
    expect(corrected).toContain('the store');
    expect(corrected).not.toMatch(/ {2,}/);
    expect(issues.some((i) => i.type === 'spelling')).toBe(true);
    expect(issues.some((i) => i.type === 'grammar')).toBe(true);
  });
});
