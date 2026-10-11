import {
  africanMarkets,
  africanMarketSummaries,
  buildEverydayCorridors,
  buildLearnBackCorridors,
  buildLearnBackMarketScenarioSeeds,
  buildRelayCorridors,
  HAND_AUTHORED_ENGLISH_IDENTITY_IDS,
} from '../src/african-markets';
import { ACCENT_IDENTITY_SEEDS } from '../src/accents/accent-identity-seeds';
import { CULTURAL_ENGLISH_BCP47_DEFAULTS } from '../src/accents/cultural-identity';
import { EVERYDAY_CORRIDORS } from '../src/everyday/everyday.types';
import { LEARNBACK_CORRIDORS } from '../src/learnback/learnback.types';
import { RELAY_CORRIDORS } from '../src/relay/relay.types';
import { relayCatalog } from '../src/relay/relay.catalog';
import { everydayCatalog } from '../src/everyday/everyday.catalog';
import { learnbackCatalog } from '../src/learnback/learnback.catalog';
import { SYSTEM_SCENARIO_SEEDS } from '../src/learnback/learnback.checks';

const PRIORITY = ['ZA', 'NG', 'RW', 'ET', 'KE', 'UG', 'ZW', 'ZM', 'TZ', 'GH'] as const;

describe('African market corridors', () => {
  it('covers named priority markets with local languages', () => {
    const markets = africanMarkets();
    expect(markets.length).toBeGreaterThanOrEqual(50);
    for (const code of PRIORITY) {
      const m = markets.find((x) => x.code === code);
      expect(m, code).toBeTruthy();
      expect(m!.localLanguages.length + m!.bridgeLanguages.length).toBeGreaterThan(0);
    }
  });

  it('attaches a country-identifying English accent to every market', () => {
    const markets = africanMarkets();
    for (const m of markets) {
      expect(m.englishAccent.bcp47).toBe(`en-${m.code}`);
      expect(m.englishAccent.nameEn).toMatch(/English$/);
      expect(m.englishAccent.nameEn.toLowerCase()).not.toContain('american');
      expect(m.englishAccent.nameEn.toLowerCase()).not.toContain('british');
      expect(m.englishAccent.accentIdentityId.length).toBeGreaterThan(3);
      expect(m.englishAccent.echoVoiceId.startsWith('own:en-')).toBe(true);
    }
    expect(markets.find((m) => m.code === 'NG')!.englishAccent.nameEn).toBe('Nigerian English');
    expect(markets.find((m) => m.code === 'KE')!.englishAccent.nameEn).toBe('Kenyan English');
    expect(markets.find((m) => m.code === 'GH')!.englishAccent.accentIdentityId).toBe(
      HAND_AUTHORED_ENGLISH_IDENTITY_IDS.GH,
    );
    expect(markets.find((m) => m.code === 'ZA')!.englishAccent.voiceProvisioning).toBe('dedicated');
    expect(markets.find((m) => m.code === 'TZ')!.englishAccent.voiceProvisioning).toBe(
      'nearest_african_english',
    );
  });

  it('labels English corridors with the market accent and wires accent identity defaults', () => {
    const relay = buildRelayCorridors().find(
      (c) => c.marketCode === 'NG' && c.sourceLanguage === 'yo' && c.targetLanguage === 'en',
    );
    expect(relay?.label).toContain('Nigerian English');
    expect(relay?.englishAccent?.bcp47).toBe('en-NG');

    const everyday = buildEverydayCorridors().find(
      (c) => c.marketCode === 'KE' && c.sourceLanguage === 'en' && c.targetLanguage === 'sw',
    );
    expect(everyday?.label).toContain('Kenyan English');
    expect(everyday?.englishAccent?.accentIdentityId).toBe('ke-english');

    const learnback = buildLearnBackCorridors().find(
      (c) => c.marketCode === 'ZA' && c.practiceLanguage === 'en',
    );
    expect(learnback?.label).toContain('South African English');
    expect(learnback?.note.toLowerCase()).toContain('south african english');

    for (const m of africanMarkets()) {
      const def = CULTURAL_ENGLISH_BCP47_DEFAULTS[m.englishAccent.bcp47];
      expect(def, m.code).toBeTruthy();
      expect(def!.accentIdentityId).toBe(m.englishAccent.accentIdentityId);
      expect(ACCENT_IDENTITY_SEEDS.some((s) => s.id === m.englishAccent.accentIdentityId)).toBe(
        true,
      );
    }

    const summaries = africanMarketSummaries();
    expect(summaries.every((s) => s.englishAccent?.nameEn.endsWith('English'))).toBe(true);
    expect(summaries.find((s) => s.code === 'GH')!.bridgeLanguageLabels).toContain(
      'Ghanaian English',
    );
  });

  it('builds Relay corridors for every priority market including historical Ghana ids', () => {
    const corridors = buildRelayCorridors();
    expect(corridors.some((c) => c.id === 'ak-en-business')).toBe(true);
    expect(corridors.some((c) => c.id === 'en-ak-business')).toBe(true);
    for (const code of PRIORITY) {
      const hit = corridors.filter((c) => c.marketCode === code);
      expect(hit.length, code).toBeGreaterThan(0);
    }
    expect(corridors.some((c) => c.marketCode === 'NG' && c.sourceLanguage === 'yo')).toBe(true);
    expect(corridors.some((c) => c.marketCode === 'ZA' && c.sourceLanguage === 'zu')).toBe(true);
    expect(corridors.some((c) => c.marketCode === 'KE' && c.sourceLanguage === 'sw')).toBe(true);
    expect(corridors.some((c) => c.marketCode === 'ET' && c.sourceLanguage === 'am')).toBe(true);
    expect(corridors.some((c) => c.marketCode === 'RW' && c.sourceLanguage === 'rw')).toBe(true);
    expect(JSON.stringify(corridors).toLowerCase()).not.toContain('todo');
    expect(JSON.stringify(corridors).toLowerCase()).not.toContain('mvp');
  });

  it('wires Everyday and LearnBack catalogs to the same markets', () => {
    expect(EVERYDAY_CORRIDORS.length).toBeGreaterThan(100);
    expect(LEARNBACK_CORRIDORS.length).toBeGreaterThan(100);
    expect(RELAY_CORRIDORS.length).toBeGreaterThan(100);

    const everyday = everydayCatalog();
    const learnback = learnbackCatalog();
    const relay = relayCatalog();
    expect(everyday.marketCount).toBeGreaterThanOrEqual(50);
    expect(learnback.marketCount).toBeGreaterThanOrEqual(50);
    expect(relay.marketCount).toBeGreaterThanOrEqual(50);
    expect(everyday.corridorCount).toBe(EVERYDAY_CORRIDORS.length);
    expect(learnback.corridorCount).toBe(LEARNBACK_CORRIDORS.length);
    expect(relay.corridorCount).toBe(RELAY_CORRIDORS.length);
    expect(relay.markets[0]).toHaveProperty('englishAccent');
    expect(JSON.stringify(relay.honesty).toLowerCase()).toContain('country-identifying');

    const seeds = buildLearnBackMarketScenarioSeeds(buildLearnBackCorridors());
    expect(seeds.length).toBeGreaterThan(50);
    expect(SYSTEM_SCENARIO_SEEDS.length).toBeGreaterThan(seeds.length);
    expect(buildEverydayCorridors().some((c) => c.id === 'en-ak')).toBe(true);
  });
});
