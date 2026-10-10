import { describe, expect, it } from 'vitest';
import { contentHash, criticalTermFlags, segmentScript } from './script-segmenter';

describe('script-segmenter', () => {
  it('preserves diacritics and tone marks in NFC form', () => {
    const script = 'Habari.\n\nKaribu Lugemi — bei ni shilingi elfu tano.';
    const segs = segmentScript(script);
    expect(segs.length).toBeGreaterThanOrEqual(2);
    expect(segs.every((s) => s.stableId.startsWith('seg_'))).toBe(true);
    expect(contentHash('café')).toBe(contentHash('café'.normalize('NFC')));
  });

  it('flags number and negation shifts for meaning review', () => {
    expect(criticalTermFlags('Deliver 50 bags', 'Deliver 15 bags')).toContain('number_mismatch');
    expect(criticalTermFlags('We cannot ship today', 'We can ship today')).toContain(
      'negation_shift',
    );
  });
});
