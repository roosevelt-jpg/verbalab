import {
  allProductMarkets,
  buildEverydayCorridors,
  buildLearnBackCorridors,
  buildRelayCorridors,
} from '../src/african-markets';
import { ACCENT_IDENTITY_SEEDS } from '../src/accents/accent-identity-seeds';
import { CULTURAL_ENGLISH_BCP47_DEFAULTS } from '../src/accents/cultural-identity';
import { COUNTRY_PACK_SEEDS } from '../src/country-packs/country-pack-seeds';
import {
  ANGLOSPHERE_MARKET_CODES,
  LATAM_MARKET_CODES,
  MENA_MARKET_CODES,
  SEA_MARKET_CODES,
  anglosphereMarkets,
  latamMarkets,
  menaMarkets,
  seaMarkets,
} from '../src/world-markets';
import { everydayCatalog } from '../src/everyday/everyday.catalog';
import { learnbackCatalog } from '../src/learnback/learnback.catalog';
import { relayCatalog } from '../src/relay/relay.catalog';

describe('LATAM / SEA / Middle East / Anglosphere markets', () => {
  it('covers LATAM, SEA, Middle East, and Anglosphere market codes with local languages', () => {
    expect(latamMarkets().length).toBe(LATAM_MARKET_CODES.length);
    expect(seaMarkets().length).toBe(SEA_MARKET_CODES.length);
    expect(menaMarkets().length).toBe(MENA_MARKET_CODES.length);
    expect(anglosphereMarkets().length).toBe(ANGLOSPHERE_MARKET_CODES.length);

    for (const code of [
      'MX',
      'BR',
      'AR',
      'PH',
      'ID',
      'TH',
      'SA',
      'AE',
      'IQ',
      'US',
      'CA',
      'AU',
      'NZ',
      'GB',
      'IE',
    ] as const) {
      const m = allProductMarkets().find((x) => x.code === code);
      expect(m, code).toBeTruthy();
      expect(m!.localLanguages.length + m!.bridgeLanguages.length).toBeGreaterThan(0);
      expect(m!.englishAccent.nameEn).toMatch(/English$/);
      expect(m!.culturalVarieties.length).toBeGreaterThan(0);
    }

    // English-only Caribbean markets still expose country English / Creole-contact culture.
    for (const code of ['JM', 'TT', 'GY'] as const) {
      const m = allProductMarkets().find((x) => x.code === code);
      expect(m!.culturalVarieties.length).toBeGreaterThan(0);
      expect(m!.culturalVarieties.some((v) => v.varietyName.endsWith('English'))).toBe(true);
    }

    const us = allProductMarkets().find((x) => x.code === 'US')!;
    expect(us.englishAccent.accentIdentityId).toBe('us-general-american');
    expect(us.culturalVarieties.some((v) => v.accentIdentityId === 'us-aave')).toBe(true);
    expect(us.culturalVarieties.some((v) => v.accentIdentityId === 'us-southern-english')).toBe(
      true,
    );

    const gb = allProductMarkets().find((x) => x.code === 'GB')!;
    expect(gb.englishAccent.accentIdentityId).toBe('gb-british');
    expect(gb.culturalVarieties.some((v) => v.accentIdentityId === 'gb-scottish-english')).toBe(
      true,
    );
    expect(gb.localLanguages).toEqual(expect.arrayContaining(['cy', 'gd']));

    const ca = allProductMarkets().find((x) => x.code === 'CA')!;
    expect(ca.englishAccent.nameEn).toBe('Canadian English');
    expect(ca.bridgeLanguages).toEqual(expect.arrayContaining(['en', 'fr']));

    const nz = allProductMarkets().find((x) => x.code === 'NZ')!;
    expect(nz.englishAccent.nameEn).toBe('New Zealand English');
    expect(nz.localLanguages).toContain('mi');
  });

  it('labels corridors with country English and local dialect varieties', () => {
    const relay = buildRelayCorridors();
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'MX' &&
          c.label.includes('Mexican Spanish') &&
          c.label.includes('Mexican English'),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'PH' &&
          (c.label.includes('Filipino') || c.label.includes('Cebuano')) &&
          c.label.includes('Filipino English'),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'SA' &&
          c.label.toLowerCase().includes('arabic') &&
          c.label.includes('Saudi English'),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) => c.marketCode === 'BR' && c.label.includes('Brazilian Portuguese'),
      ),
    ).toBe(true);
    expect(
      buildEverydayCorridors().some(
        (c) => c.marketCode === 'AR' && c.label.includes('Rioplatense'),
      ),
    ).toBe(true);
    expect(
      buildLearnBackCorridors().some(
        (c) => c.marketCode === 'ID' && c.label.toLowerCase().includes('javanese'),
      ),
    ).toBe(true);

    expect(
      relay.some(
        (c) =>
          c.marketCode === 'US' &&
          c.label.includes('American English') &&
          (c.label.includes('Spanish') || c.label.includes('Navajo') || c.label.includes('Cherokee')),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'CA' &&
          c.label.includes('Canadian English') &&
          c.label.toLowerCase().includes('québécois'),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'NZ' &&
          c.label.includes('New Zealand English') &&
          (c.label.includes('Māori') || c.label.includes('Maori')),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'GB' &&
          c.label.includes('British English') &&
          (c.label.includes('Welsh') || c.label.includes('Scottish Gaelic')),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'IE' &&
          c.label.includes('Irish English') &&
          c.label.includes('Irish'),
      ),
    ).toBe(true);
    expect(
      relay.some(
        (c) =>
          c.marketCode === 'AU' &&
          c.label.includes('Australian English') &&
          c.label.toLowerCase().includes('mandarin'),
      ),
    ).toBe(true);
  });

  it('wires cultural English defaults and accent-identity packs for world markets', () => {
    for (const code of [
      'MX',
      'BR',
      'PH',
      'SG',
      'SA',
      'AE',
      'LB',
      'TR',
      'US',
      'CA',
      'AU',
      'NZ',
      'GB',
      'IE',
    ] as const) {
      const def = CULTURAL_ENGLISH_BCP47_DEFAULTS[`en-${code}`];
      expect(def, `en-${code}`).toBeTruthy();
      expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === def!.accentIdentityId)).toBe(true);
    }
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'ar-rioplatense')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'ae-gulf-arabic')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'pe-quechua')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'us-aave')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'us-southern-english')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'gb-scottish-english')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'au-aboriginal-english')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'nz-pasifika-english')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'nz-maori')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'ca-quebecois')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.length).toBeGreaterThan(150);
  });

  it('covers every country pack with a country-identifying English accent identity', () => {
    const englishByCountry = new Set(
      ACCENT_IDENTITY_SEEDS.filter(
        (s) => s.languageCode === 'en' || (s.bcp47 ?? '').toLowerCase().startsWith('en-'),
      ).map((s) => s.country),
    );
    for (const pack of COUNTRY_PACK_SEEDS) {
      expect(englishByCountry.has(pack.code), `missing English identity for ${pack.code}`).toBe(true);
    }
    expect(englishByCountry.size).toBe(COUNTRY_PACK_SEEDS.length);
  });

  it('expands product catalogs beyond Africa-only counts', () => {
    const markets = allProductMarkets();
    expect(markets.length).toBeGreaterThanOrEqual(96);
    expect(markets.some((m) => m.worldRegion === 'latam')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'sea')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'mena')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'anglosphere')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'africa')).toBe(true);

    const relay = relayCatalog();
    const everyday = everydayCatalog();
    const learnback = learnbackCatalog();
    expect(relay.marketCount).toBe(markets.length);
    expect(everyday.marketCount).toBe(markets.length);
    expect(learnback.marketCount).toBe(markets.length);
    expect(relay.corridorCount).toBeGreaterThan(700);
    expect(JSON.stringify(relay.honesty).toLowerCase()).toContain('dialect');
  });

  it('wires every product market into Relay/Everyday/LearnBack corridors with accents', () => {
    const markets = allProductMarkets();
    const relay = buildRelayCorridors();
    const everyday = buildEverydayCorridors();
    const learnback = buildLearnBackCorridors();

    for (const m of markets) {
      expect(m.englishAccent.bcp47).toBe(`en-${m.code}`);
      expect(CULTURAL_ENGLISH_BCP47_DEFAULTS[m.englishAccent.bcp47]).toBeTruthy();
      expect(
        ACCENT_IDENTITY_SEEDS.some((s) => s.id === m.englishAccent.accentIdentityId),
      ).toBe(true);
      expect(m.culturalVarieties.length, m.code).toBeGreaterThan(0);

      const hasNonEn =
        m.localLanguages.some((l) => l !== 'en') ||
        m.bridgeLanguages.some((l) => l !== 'en');
      if (hasNonEn) {
        expect(relay.some((c) => c.marketCode === m.code), `relay ${m.code}`).toBe(true);
        expect(everyday.some((c) => c.marketCode === m.code), `everyday ${m.code}`).toBe(
          true,
        );
        expect(learnback.some((c) => c.marketCode === m.code), `learnback ${m.code}`).toBe(
          true,
        );
      }
    }

    expect(relay.some((c) => c.marketCode === 'MX')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'PH')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'AE')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'BR')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'US')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'CA')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'AU')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'NZ')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'GB')).toBe(true);
    expect(relay.some((c) => c.marketCode === 'IE')).toBe(true);
  });
});
