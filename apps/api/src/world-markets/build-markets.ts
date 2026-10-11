import { COUNTRY_PACK_SEEDS } from '../country-packs/country-pack-seeds';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import { type AfricanEnglishAccent } from '../african-markets/african-english-accents';
import {
  allWorldMarketCodes,
  BRIDGE_BY_MARKET,
  MARKET_TIMEZONES,
  RATE_PER_15_MIN_MINOR,
  WORLD_PRODUCT_REGION_BY_CODE,
  type WorldProductRegion,
} from './region-defs';
import {
  buildCountryEnglishAccent,
  type CountryEnglishAccent,
} from './country-english-accents';
import { buildCulturalVarieties, type CulturalVariety } from './cultural-varieties';

const LANGUAGE_BY_CODE = new Map(LANGUAGE_SEEDS.map((l) => [l.code, l]));

export type ProductWorldRegion = 'africa' | WorldProductRegion;

/** Unified English accent shape used across Africa + world markets. */
export type ProductEnglishAccent = (AfricanEnglishAccent | CountryEnglishAccent) & {
  worldRegion?: ProductWorldRegion;
};

export type ProductMarket = {
  code: string;
  nameEn: string;
  region: string;
  worldRegion: ProductWorldRegion;
  currencyCode: string;
  timezone: string;
  bridgeLanguages: string[];
  localLanguages: string[];
  englishAccent: ProductEnglishAccent;
  culturalVarieties: CulturalVariety[];
};

function buildMarketFromPack(
  pack: (typeof COUNTRY_PACK_SEEDS)[number],
  worldRegion: ProductWorldRegion,
  bridgesIn: string[],
  timezone: string,
  englishAccent: ProductEnglishAccent,
): ProductMarket {
  const bridges = bridgesIn.filter((b) => LANGUAGE_BY_CODE.has(b));
  const locals = pack.primaryLanguages.filter(
    (l) => l !== 'en' && !bridges.includes(l) && LANGUAGE_BY_CODE.has(l),
  );
  const workingLocals =
    locals.length > 0
      ? locals
      : pack.primaryLanguages.filter((l) => LANGUAGE_BY_CODE.has(l) && l !== 'en');
  const bridgeLanguages = bridges.length ? bridges : ['en'];
  const localLanguages = workingLocals;
  let culturalVarieties =
    worldRegion === 'africa'
      ? buildAfricaCulturalVarieties(pack, localLanguages, bridgeLanguages)
      : buildCulturalVarieties({
          code: pack.code,
          nameEn: pack.nameEn,
          region: pack.region,
          worldRegion,
          localLanguages,
          bridgeLanguages,
        });

  // English-only markets (e.g. Jamaica) still expose the country English variety.
  if (culturalVarieties.length === 0) {
    culturalVarieties = [
      {
        languageCode: 'en',
        languageName: 'English',
        varietyName: englishAccent.nameEn,
        dialects: [englishAccent.nameEn],
        accents: [`${englishAccent.nameEn} (spoken)`],
        bcp47: englishAccent.bcp47,
        accentIdentityId: englishAccent.accentIdentityId,
        primaryLabel: true,
        culturalNotes: `${englishAccent.nameEn} is the country-identifying bridge variety for ${pack.nameEn}.`,
      },
    ];
  }

  return {
    code: pack.code,
    nameEn: pack.nameEn,
    region: pack.region,
    worldRegion,
    currencyCode: pack.currencyCode,
    timezone,
    bridgeLanguages,
    localLanguages,
    englishAccent,
    culturalVarieties,
  };
}

/** Lightweight cultural varieties for African markets from pack languages + notes. */
function buildAfricaCulturalVarieties(
  pack: (typeof COUNTRY_PACK_SEEDS)[number],
  localLanguages: string[],
  bridgeLanguages: string[],
): CulturalVariety[] {
  const langs = [...new Set([...localLanguages, ...bridgeLanguages])].filter((l) => l !== 'en');
  return langs.map((code) => {
    const langName = LANGUAGE_BY_CODE.get(code)?.nameEn ?? code;
    return {
      languageCode: code,
      languageName: langName,
      varietyName: `${pack.nameEn} ${langName}`,
      dialects: [`${pack.nameEn} ${langName}`],
      accents: [`${pack.nameEn} ${langName} (spoken)`],
      bcp47: `${code}-${pack.code}`,
      accentIdentityId: undefined,
      primaryLabel: true,
      culturalNotes: pack.culturalNotes,
    };
  });
}

export function latamMarkets(): ProductMarket[] {
  const wanted = new Set<string>(allWorldMarketCodes().filter((c) => WORLD_PRODUCT_REGION_BY_CODE[c] === 'latam'));
  return COUNTRY_PACK_SEEDS.filter((p) => wanted.has(p.code)).map((pack) => {
    const worldRegion = 'latam' as const;
    return buildMarketFromPack(
      pack,
      worldRegion,
      BRIDGE_BY_MARKET[pack.code] ?? ['en'],
      MARKET_TIMEZONES[pack.code] ?? 'UTC',
      buildCountryEnglishAccent({
        code: pack.code,
        nameEn: pack.nameEn,
        region: pack.region,
        worldRegion,
      }),
    );
  });
}

export function seaMarkets(): ProductMarket[] {
  const wanted = new Set<string>(allWorldMarketCodes().filter((c) => WORLD_PRODUCT_REGION_BY_CODE[c] === 'sea'));
  return COUNTRY_PACK_SEEDS.filter((p) => wanted.has(p.code)).map((pack) => {
    const worldRegion = 'sea' as const;
    return buildMarketFromPack(
      pack,
      worldRegion,
      BRIDGE_BY_MARKET[pack.code] ?? ['en'],
      MARKET_TIMEZONES[pack.code] ?? 'UTC',
      buildCountryEnglishAccent({
        code: pack.code,
        nameEn: pack.nameEn,
        region: pack.region,
        worldRegion,
      }),
    );
  });
}

export function menaMarkets(): ProductMarket[] {
  const wanted = new Set<string>(allWorldMarketCodes().filter((c) => WORLD_PRODUCT_REGION_BY_CODE[c] === 'mena'));
  return COUNTRY_PACK_SEEDS.filter((p) => wanted.has(p.code)).map((pack) => {
    const worldRegion = 'mena' as const;
    return buildMarketFromPack(
      pack,
      worldRegion,
      BRIDGE_BY_MARKET[pack.code] ?? ['en'],
      MARKET_TIMEZONES[pack.code] ?? 'UTC',
      buildCountryEnglishAccent({
        code: pack.code,
        nameEn: pack.nameEn,
        region: pack.region,
        worldRegion,
      }),
    );
  });
}

/** Non-African product markets (LATAM + SEA + Middle East). */
export function worldMarkets(): ProductMarket[] {
  return [...latamMarkets(), ...seaMarkets(), ...menaMarkets()];
}

/**
 * All Everyday / LearnBack / Relay product markets:
 * Africa + LATAM + SEA + Middle East.
 */
export function productMarkets(african: ProductMarket[]): ProductMarket[] {
  const seen = new Set<string>();
  const out: ProductMarket[] = [];
  for (const m of [...african, ...worldMarkets()]) {
    if (seen.has(m.code)) continue;
    seen.add(m.code);
    out.push(m);
  }
  return out;
}

export function quoteRateForWorldCurrency(currencyCode: string): number | undefined {
  return RATE_PER_15_MIN_MINOR[currencyCode];
}

/** Helper to lift existing africanMarkets() rows into ProductMarket shape. */
export function asAfricaProductMarkets(
  rows: Array<{
    code: string;
    nameEn: string;
    region: string;
    currencyCode: string;
    timezone: string;
    bridgeLanguages: string[];
    localLanguages: string[];
    englishAccent: AfricanEnglishAccent;
  }>,
): ProductMarket[] {
  return rows.map((r) => {
    const pack = COUNTRY_PACK_SEEDS.find((p) => p.code === r.code);
    return {
      ...r,
      worldRegion: 'africa' as const,
      englishAccent: { ...r.englishAccent, worldRegion: 'africa' as const },
      culturalVarieties: pack
        ? buildAfricaCulturalVarieties(pack, r.localLanguages, r.bridgeLanguages)
        : [],
    };
  });
}
