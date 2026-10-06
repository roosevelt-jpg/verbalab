import { describe, expect, it } from 'vitest';
import { estimateTranslationQuality } from '../src/quality/quality-estimate';

describe('quality-estimate', () => {
  it('scores TM hits highly', () => {
    const q = estimateTranslationQuality({
      sourceText: 'Hello',
      targetText: 'Habari',
      sourceLang: 'en',
      targetLang: 'sw',
      provider: 'tm',
    });
    expect(q.score).toBeGreaterThanOrEqual(95);
    expect(q.needsReview).toBe(false);
  });

  it('flags identical untranslated output', () => {
    const q = estimateTranslationQuality({
      sourceText: 'Central Bank of Kenya',
      targetText: 'Central Bank of Kenya',
      sourceLang: 'en',
      targetLang: 'sw',
      provider: 'fixture',
    });
    expect(q.score).toBeLessThan(70);
    expect(q.needsReview).toBe(true);
    expect(q.reasons).toContain('identical_to_source');
  });

  it('flags empty targets', () => {
    const q = estimateTranslationQuality({
      sourceText: 'Hello',
      targetText: ' ',
      sourceLang: 'en',
      targetLang: 'yo',
      provider: 'fixture',
    });
    expect(q.score).toBe(0);
    expect(q.needsReview).toBe(true);
  });
});
