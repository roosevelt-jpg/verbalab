import { describe, expect, it } from 'vitest';
import { applyPronunciationAliases, normalizeForSynthesis } from './nse.normalize';

describe('normalizeForSynthesis', () => {
  it('preserves NFC diacritics and lexical tone marks', () => {
    const text = 'Médase. Akwaaba — ɔ'.normalize('NFC');
    const out = normalizeForSynthesis({ text, targetLang: 'ak-GH' });
    expect(out.text).toContain('Médase');
    expect(out.text).toContain('ɔ');
  });

  it('spaces currency codes without rewriting amounts', () => {
    const out = normalizeForSynthesis({ text: 'Pay GHS120 today', targetLang: 'en-GH' });
    expect(out.text).toBe('Pay GHS 120 today');
    expect(out.applied).toContain('currency_spacing');
  });

  it('applies soft emphasis via terminal pause only', () => {
    const out = normalizeForSynthesis({
      text: 'Welcome aboard',
      prosody: { emphasis: true },
    });
    expect(out.text).toBe('Welcome aboard.');
    expect(out.applied).toContain('emphasis_terminal_pause');
  });

  it('records pitch requests without fabricating regional coverage', () => {
    const out = normalizeForSynthesis({
      text: 'Hello.',
      prosody: { pitch: 'high' },
    });
    expect(out.applied).toContain('pitch_high_engine_dependent');
    expect(out.text).toBe('Hello.');
  });
});

describe('applyPronunciationAliases', () => {
  it('replaces whole-token graphemes only', () => {
    const out = applyPronunciationAliases('Meet Ama in Accra', [
      { grapheme: 'Ama', alias: 'Ah-mah' },
    ]);
    expect(out.text).toBe('Meet Ah-mah in Accra');
    expect(out.applied).toBe(1);
  });

  it('does not rewrite substrings inside longer words', () => {
    const out = applyPronunciationAliases('Amanfo gathered', [
      { grapheme: 'Ama', alias: 'Ah-mah' },
    ]);
    expect(out.text).toBe('Amanfo gathered');
    expect(out.applied).toBe(0);
  });
});
