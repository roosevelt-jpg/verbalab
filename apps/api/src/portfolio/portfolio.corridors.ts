import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import { LOCALE_PACK_SEEDS } from '../locales/locale-pack-seeds';
import {
  COUNTRY_PACK_COUNT,
  COUNTRY_PACK_SEEDS,
  type CountryPackSeed,
} from '../country-packs/country-pack-seeds';

export type PortfolioCorridor = {
  id: string;
  sourceTags: string[];
  varietyId: string;
  /** Always includes country name in parentheses, e.g. Hausa–English (Nigeria). */
  label: string;
  /** Design-partner corridors with historical demo calibration only. */
  evaluated: boolean;
  languageCode: string;
  nameEn: string;
  nameNative?: string;
  bcp47: string;
  tier: 'vendor' | 'strategic_african';
  countryCode: string;
  countryName: string;
  region: string;
};

const LANGUAGE_BY_CODE = new Map(LANGUAGE_SEEDS.map((l) => [l.code, l]));

const PREFERRED_VARIETY: Record<string, string> = {
  'ak-GH': 'ak-GH-twi',
  'yo-NG': 'yo-NG',
  'ha-NG': 'ha-NG',
  'sw-TZ': 'sw-TZ',
  'sw-KE': 'sw-KE',
  'ig-NG': 'ig-NG',
  'am-ET': 'am-ET',
  'zu-ZA': 'zu-ZA',
  'ee-GH': 'ee-GH',
  'pcm-NG': 'pcm-NG',
};

const EVALUATED_VARIETIES = new Set(['ak-GH-twi', 'yo-NG']);

const HISTORICAL_IDS: Record<string, string> = {
  'ak-GH': 'twi-english',
  'yo-NG': 'yoruba-english',
  'ha-NG': 'hausa-english',
};

function displayLanguageName(langCode: string, nameEn: string): string {
  if (langCode === 'ak') return 'Twi';
  return nameEn;
}

function corridorSlug(nameEn: string, code: string, countryCode: string): string {
  const historical = HISTORICAL_IDS[`${code}-${countryCode}`];
  if (historical) return historical;
  const slug = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || code}-english-${countryCode.toLowerCase()}`;
}

function regionFromBcp47(tag: string): string | null {
  const parts = tag.split(/[-_]/);
  for (let i = parts.length - 1; i >= 1; i--) {
    const p = parts[i]!;
    if (/^[A-Za-z]{2}$/.test(p)) return p.toUpperCase();
  }
  return null;
}

function languageFromBcp47(tag: string): string {
  return tag.split(/[-_]/)[0]!.toLowerCase();
}

function varietyFor(langCode: string, countryCode: string, packTags: string[]): string {
  const key = `${langCode}-${countryCode}`;
  const preferred = PREFERRED_VARIETY[key];
  if (preferred) {
    if (preferred.includes('-twi')) return preferred;
    const hit = LOCALE_PACK_SEEDS.find((p) => p.bcp47 === preferred);
    if (hit) return hit.bcp47;
    return preferred;
  }
  const fromPack = packTags.find((t) => languageFromBcp47(t) === langCode);
  if (fromPack) return fromPack;
  const fromLocale = LOCALE_PACK_SEEDS.find(
    (p) => p.languageCode === langCode && regionFromBcp47(p.bcp47) === countryCode,
  );
  if (fromLocale) return fromLocale.bcp47;
  return `${langCode}-${countryCode}`;
}

function languagesForCountry(pack: CountryPackSeed): string[] {
  const codes = new Set<string>();
  for (const lang of pack.primaryLanguages) {
    if (lang !== 'en' && LANGUAGE_BY_CODE.has(lang)) codes.add(lang);
  }
  for (const tag of pack.bcp47Tags) {
    const lang = languageFromBcp47(tag);
    if (lang !== 'en' && LANGUAGE_BY_CODE.has(lang)) codes.add(lang);
  }
  return [...codes].sort();
}

export function buildPortfolioCorridors(): PortfolioCorridor[] {
  const corridors: PortfolioCorridor[] = [];
  const seenIds = new Set<string>();

  for (const pack of COUNTRY_PACK_SEEDS) {
    for (const langCode of languagesForCountry(pack)) {
      const lang = LANGUAGE_BY_CODE.get(langCode);
      if (!lang) continue;
      const varietyId = varietyFor(langCode, pack.code, pack.bcp47Tags);
      const displayName = displayLanguageName(langCode, lang.nameEn);
      const id = corridorSlug(displayName, langCode, pack.code);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      corridors.push({
        id,
        sourceTags: [langCode, 'en'],
        varietyId,
        label: `${displayName}–English (${pack.nameEn})`,
        evaluated: EVALUATED_VARIETIES.has(varietyId),
        languageCode: langCode,
        nameEn: displayName,
        nameNative: lang.nameNative,
        bcp47: varietyId.includes('-twi') ? 'ak-GH' : varietyId,
        tier: lang.tier,
        countryCode: pack.code,
        countryName: pack.nameEn,
        region: pack.region,
      });
    }
  }

  return corridors;
}

export const PORTFOLIO_CORRIDORS: PortfolioCorridor[] = buildPortfolioCorridors();
export const PORTFOLIO_CORRIDOR_COUNT = PORTFOLIO_CORRIDORS.length;
export const PORTFOLIO_COUNTRIES_COVERED = new Set(PORTFOLIO_CORRIDORS.map((c) => c.countryCode)).size;
export const PORTFOLIO_COUNTRY_PACK_TOTAL = COUNTRY_PACK_COUNT;

export type PortfolioCountrySummary = {
  code: string;
  nameEn: string;
  region: string;
  corridorCount: number;
};

export function portfolioCountrySummaries(): PortfolioCountrySummary[] {
  const counts = new Map<string, number>();
  for (const c of PORTFOLIO_CORRIDORS) {
    counts.set(c.countryCode, (counts.get(c.countryCode) ?? 0) + 1);
  }
  return COUNTRY_PACK_SEEDS.map((pack) => ({
    code: pack.code,
    nameEn: pack.nameEn,
    region: pack.region,
    corridorCount: counts.get(pack.code) ?? 0,
  }));
}

export function findCorridorByLanguage(code: string): PortfolioCorridor | undefined {
  const normalized = code.trim().toLowerCase();
  return PORTFOLIO_CORRIDORS.find(
    (c) =>
      c.languageCode === normalized ||
      c.varietyId.toLowerCase() === normalized ||
      c.id === normalized ||
      c.countryCode.toLowerCase() === normalized,
  );
}

export function registryLanguageTags(): string[] {
  return LANGUAGE_SEEDS.map((l) => l.code);
}
