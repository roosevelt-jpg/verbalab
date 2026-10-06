import { LANGUAGE_SEEDS, TOTAL_LANGUAGE_COUNT } from '../languages/language-seeds';
import { LOCALE_PACK_SEEDS } from '../locales/locale-pack-seeds';

export type PortfolioCorridor = {
  id: string;
  sourceTags: string[];
  varietyId: string;
  label: string;
  /** Strategic corridors with historical demo calibration. */
  evaluated: boolean;
  languageCode: string;
  nameEn: string;
  nameNative?: string;
  bcp47: string;
  tier: 'vendor' | 'strategic_african';
};

/** Prefer these locale varieties when multiple BCP-47 packs exist for a language. */
const PREFERRED_VARIETY: Record<string, string> = {
  ak: 'ak-GH-twi',
  yo: 'yo-NG',
  ha: 'ha-NG',
  sw: 'sw-TZ',
  ig: 'ig-NG',
  am: 'am-ET',
  zu: 'zu-ZA',
  xh: 'xh-ZA',
  af: 'af-ZA',
  ee: 'ee-GH',
  fr: 'fr-SN',
  ar: 'ar-EG',
  pt: 'pt-AO',
  pcm: 'pcm-NG',
  bm: 'bm-ML',
  ff: 'ff-SN',
  ln: 'ln-CD',
  lg: 'lg-UG',
  rw: 'rw-RW',
  sn: 'sn-ZW',
  so: 'so-SO',
  ti: 'ti-ET',
  wo: 'wo-SN',
  ny: 'ny-MW',
  om: 'om-ET',
  tn: 'tn-BW',
};

/** Corridors with historical demo calibration / design-partner evaluation. */
const EVALUATED_CODES = new Set(['ak', 'yo', 'sw', 'ha', 'ig', 'am', 'ee', 'zu']);

function primaryBcp47(languageCode: string): string {
  const preferred = PREFERRED_VARIETY[languageCode];
  if (preferred) {
    const base = preferred.split('-').slice(0, 2).join('-');
    const hit = LOCALE_PACK_SEEDS.find((p) => p.bcp47 === preferred || p.bcp47 === base);
    if (hit) return preferred.includes('-twi') ? preferred : hit.bcp47;
    return preferred;
  }
  const pack = LOCALE_PACK_SEEDS.find((p) => p.languageCode === languageCode);
  return pack?.bcp47 ?? languageCode;
}

function corridorSlug(code: string, nameEn: string): string {
  const slug = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || code}-english`;
}

/**
 * Full registry corridors: every non-English language ↔ English.
 * Catalog membership enables selection; evaluated=true only for strategic demos.
 */
export function buildPortfolioCorridors(): PortfolioCorridor[] {
  const corridors: PortfolioCorridor[] = [];
  for (const lang of LANGUAGE_SEEDS) {
    if (lang.code === 'en') continue;
    const varietyId = primaryBcp47(lang.code);
    const id = corridorSlug(lang.code, lang.nameEn);
    corridors.push({
      id,
      sourceTags: [lang.code, 'en'],
      varietyId,
      label: `${lang.nameEn}–English`,
      evaluated: EVALUATED_CODES.has(lang.code),
      languageCode: lang.code,
      nameEn: lang.nameEn,
      nameNative: lang.nameNative,
      bcp47: varietyId.includes('-twi') ? 'ak-GH' : varietyId,
      tier: lang.tier,
    });
  }
  return corridors;
}

export const PORTFOLIO_CORRIDORS: PortfolioCorridor[] = buildPortfolioCorridors();

export const PORTFOLIO_CORRIDOR_COUNT = PORTFOLIO_CORRIDORS.length;

/** Expected: all registry languages except English. */
export const EXPECTED_CORRIDOR_COUNT = TOTAL_LANGUAGE_COUNT - 1;

export function assertPortfolioCorridorsComplete() {
  if (PORTFOLIO_CORRIDOR_COUNT !== EXPECTED_CORRIDOR_COUNT) {
    throw new Error(
      `PORTFOLIO_CORRIDORS has ${PORTFOLIO_CORRIDOR_COUNT}; expected ${EXPECTED_CORRIDOR_COUNT}`,
    );
  }
}

export function findCorridorByLanguage(code: string): PortfolioCorridor | undefined {
  const normalized = code.trim().toLowerCase();
  return PORTFOLIO_CORRIDORS.find(
    (c) =>
      c.languageCode === normalized ||
      c.varietyId.toLowerCase() === normalized ||
      c.id === normalized,
  );
}

export function registryLanguageTags(): string[] {
  return LANGUAGE_SEEDS.map((l) => l.code);
}
