import { describe, expect, it } from 'vitest';
import {
  enforceGlossaryTargets,
  protectGlossaryTerms,
  restoreGlossaryPlaceholders,
} from '../src/glossary/glossary-apply';

describe('glossary-apply',  => {
  it('protects longest terms first and restores targets',  => {
    const terms = [
      {
        sourceTerm: 'Central Bank',
        targetTerm: 'Benki Kuu',
        caseSensitive: false,
        wholeWord: true,
      },
      { sourceTerm: 'Bank', targetTerm: 'Benki', caseSensitive: false, wholeWord: true },
    ];
    const protectedText = protectGlossaryTerms('Visit the Central Bank today', terms);
    expect(protectedText.text).toBe('Visit the ⟦VL0⟧ today');
    expect(protectedText.replacements).toHaveLength(1);

    const restored = restoreGlossaryPlaceholders(
      `[sw] ${protectedText.text}`,
      protectedText.replacements,
    );
    expect(restored).toBe('[sw] Visit the Benki Kuu today');
  });

  it('enforces targets when source term remains',  => {
    const out = enforceGlossaryTargets('Use M-Pesa now', [
      { sourceTerm: 'M-Pesa', targetTerm: 'M-Pesa', caseSensitive: false, wholeWord: true },
    ]);
    expect(out).toBe('Use M-Pesa now');
  });
});
