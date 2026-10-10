import {
  CULTURAL_ENGLISH_BCP47_DEFAULTS,
  deriveCulturalIdentityLabel,
  deriveLifestyleTags,
  deriveSpeechVariety,
} from './cultural-identity';

describe('cultural-identity helpers', () => {
  it('maps priority packs to speech varieties', () => {
    expect(
      deriveSpeechVariety({
        id: 'gh-ghanaian-english',
        nameEn: 'Ghanaian English',
        languageCode: 'en',
        country: 'GH',
      }),
    ).toBe('ghanaian_english');
    expect(
      deriveSpeechVariety({
        id: 'ng-pidgin',
        nameEn: 'Nigerian Pidgin',
        languageCode: 'pcm',
        country: 'NG',
      }),
    ).toBe('nigerian_pidgin');
    expect(
      deriveSpeechVariety({
        id: 'ph-filipino-english',
        nameEn: 'Filipino English',
        languageCode: 'en',
        country: 'PH',
      }),
    ).toBe('filipino_english');
  });

  it('exposes cultural English BCP-47 defaults', () => {
    expect(CULTURAL_ENGLISH_BCP47_DEFAULTS['en-GH'].accentIdentityId).toBe('gh-ghanaian-english');
    expect(CULTURAL_ENGLISH_BCP47_DEFAULTS['en-NG'].speechVariety).toBe('nigerian_english');
    expect(CULTURAL_ENGLISH_BCP47_DEFAULTS['en-PH'].echoVoiceId).toBe('own:en-ph-female');
    expect(CULTURAL_ENGLISH_BCP47_DEFAULTS['en-ZA'].accentIdentityId).toBe(
      'za-south-african-english',
    );
    expect(CULTURAL_ENGLISH_BCP47_DEFAULTS['pcm-NG'].speechVariety).toBe('nigerian_pidgin');
  });

  it('derives cultural identity labels and lifestyle tags', () => {
    const label = deriveCulturalIdentityLabel({
      nameEn: 'Ghanaian English',
      country: 'GH',
      countryLabel: 'Ghana',
      regionTags: ['Ghana', 'West Africa', 'Ghanaian English'],
    });
    expect(label).toContain('Ghanaian English');
    expect(label).toContain('Ghana');

    const tags = deriveLifestyleTags({
      id: 'gh-ghanaian-english',
      regionTags: ['Ghana'],
      country: 'GH',
      languageCode: 'en',
    });
    expect(tags).toContain('accra_professional');
  });
});
