import {
  allProductMarkets,
  buildEverydayCorridors,
  buildLearnBackCorridors,
  buildRelayCorridors,
} from '../src/african-markets';
import { ACCENT_IDENTITY_SEEDS } from '../src/accents/accent-identity-seeds';
import { CULTURAL_ENGLISH_BCP47_DEFAULTS } from '../src/accents/cultural-identity';
import {
  LATAM_MARKET_CODES,
  MENA_MARKET_CODES,
  SEA_MARKET_CODES,
  latamMarkets,
  menaMarkets,
  seaMarkets,
} from '../src/world-markets';
import { everydayCatalog } from '../src/everyday/everyday.catalog';
import { learnbackCatalog } from '../src/learnback/learnback.catalog';
import { relayCatalog } from '../src/relay/relay.catalog';

describe('LATAM / SEA / Middle East markets', () => {
  it('covers LATAM, SEA, and Middle East market codes with local languages', () => {
    expect(latamMarkets().length).toBe(LATAM_MARKET_CODES.length);
    expect(seaMarkets().length).toBe(SEA_MARKET_CODES.length);
    expect(menaMarkets().length).toBe(MENA_MARKET_CODES.length);

    for (const code of ['MX', 'BR', 'AR', 'PH', 'ID', 'TH', 'SA', 'AE', 'IQ'] as const) {
      const m = allProductMarkets().find((x) => x.code === code);
      expect(m, code).toBeTruthy();
      expect(m!.localLanguages.length + m!.bridgeLanguages.length).toBeGreaterThan(0);
      expect(m!.englishAccent.nameEn).toMatch(/English$/);
      expect(m!.culturalVarieties.length).toBeGreaterThan(0);
    }
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
  });

  it('wires cultural English defaults and accent-identity packs for world markets', () => {
    for (const code of ['MX', 'BR', 'PH', 'SG', 'SA', 'AE', 'LB', 'TR'] as const) {
      const def = CULTURAL_ENGLISH_BCP47_DEFAULTS[`en-${code}`];
      expect(def, `en-${code}`).toBeTruthy();
      expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === def!.accentIdentityId)).toBe(true);
    }
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'ar-rioplatense')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'ae-gulf-arabic')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === 'pe-quechua')).toBe(true);
    expect(ACCENT_IDENTITY_SEEDS.length).toBeGreaterThan(150);
  });

  it('expands product catalogs beyond Africa-only counts', () => {
    const markets = allProductMarkets();
    expect(markets.length).toBeGreaterThanOrEqual(90);
    expect(markets.some((m) => m.worldRegion === 'latam')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'sea')).toBe(true);
    expect(markets.some((m) => m.worldRegion === 'mena')).toBe(true);
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
});
