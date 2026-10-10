import { describe, expect, it } from 'vitest';
import {
  buildLocaleCatalogOptions,
  formatLanguageLabel,
  formatLocaleLabel,
  formatVariantLabel,
  regionDisplayName,
} from './locale-catalog';

describe('locale-catalog labels', () => {
  it('formats language as Name (code)', () => {
    expect(formatLanguageLabel({ code: 'en', name: 'English' })).toBe('English (en)');
    expect(formatLanguageLabel({ code: 'sw', name: 'Swahili' })).toBe('Swahili (sw)');
  });

  it('formats locale with region and abbreviation', () => {
    expect(
      formatLocaleLabel({ code: 'ak', name: 'Akan (Twi)', nativeName: 'Twi' }, 'ak-GH'),
    ).toBe('Twi — Ghana (ak-GH)');
    expect(formatLocaleLabel({ code: 'en', name: 'English' }, 'en-US')).toBe(
      'English — United States (en-US)',
    );
  });

  it('formats dialect/accent variants with region', () => {
    expect(
      formatVariantLabel({ code: 'ak-gh-asante', nameEn: 'Asante Twi', region: 'GH' }),
    ).toBe('Asante Twi — Ghana (ak-gh-asante)');
    expect(
      formatVariantLabel({
        code: 'en-ng',
        nameEn: 'Nigerian English (spoken)',
        region: 'NG',
      }),
    ).toBe('Nigerian English (spoken) — Nigeria (en-ng)');
  });

  it('resolves region display names', () => {
    expect(regionDisplayName('GH')).toBe('Ghana');
    expect(regionDisplayName('ng')).toBe('Nigeria');
  });

  it('builds a single catalog with languages, locales, dialects, accents', () => {
    const options = buildLocaleCatalogOptions({
      languages: [
        { code: 'en', name: 'English' },
        { code: 'ak', name: 'Akan (Twi)', nativeName: 'Twi' },
      ],
      locales: [
        { languageCode: 'en', bcp47: 'en-US' },
        { languageCode: 'ak', bcp47: 'ak-GH' },
      ],
      dialects: [{ code: 'ak-gh-asante', languageCode: 'ak', nameEn: 'Asante Twi', region: 'GH' }],
      accents: [
        { code: 'en-gh', languageCode: 'en', nameEn: 'Ghanaian English (spoken)', region: 'GH' },
      ],
    });
    expect(options.map((o) => o.value)).toEqual([
      'ak',
      'en',
      'ak-GH',
      'en-US',
      'ak-gh-asante',
      'en-gh',
    ]);
    expect(options.find((o) => o.value === 'ak-GH')?.label).toBe('Twi — Ghana (ak-GH)');
    expect(options.find((o) => o.value === 'en')?.label).toBe('English (en)');
  });
});
