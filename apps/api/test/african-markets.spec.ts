import {
  africanMarkets,
  buildEverydayCorridors,
  buildLearnBackCorridors,
  buildLearnBackMarketScenarioSeeds,
  buildRelayCorridors,
} from '../src/african-markets';
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

    const seeds = buildLearnBackMarketScenarioSeeds(buildLearnBackCorridors());
    expect(seeds.length).toBeGreaterThan(50);
    expect(SYSTEM_SCENARIO_SEEDS.length).toBeGreaterThan(seeds.length);
    expect(buildEverydayCorridors().some((c) => c.id === 'en-ak')).toBe(true);
  });
});
