import { LOCALE_PACK_SEEDS } from '../locales/locale-pack-seeds';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import {
  africaFirstCountrySort,
  ISO_COUNTRIES,
  type IsoCountryDef,
} from './iso-countries';

export type CountryPackSeed = {
  code: string;
  nameEn: string;
  region: string;
  currencyCode: string;
  primaryLanguages: string[];
  bcp47Tags: string[];
  relatedDialectCodes?: string[];
  relatedAccentCodes?: string[];
  dateNotes: string;
  numberNotes: string;
  currencyNotes: string;
  culturalNotes: string;
};

type CuratedOverride = Partial<
  Omit<CountryPackSeed, 'code'> & {
    primaryLanguages: string[];
    bcp47Tags: string[];
  }
>;

const LANGUAGE_CODES = new Set(LANGUAGE_SEEDS.map((l) => l.code));

/** Rich cultural notes for priority African packs (overrides thin defaults). */
const CURATED_OVERRIDES: Record<string, CuratedOverride> = {
  KE: {
    primaryLanguages: ['sw', 'en'],
    bcp47Tags: ['sw-KE', 'en-KE'],
    relatedDialectCodes: ['sw-ke'],
    relatedAccentCodes: ['sw-ke', 'en-ke'],
    dateNotes: 'DMY common in administration; ISO 8601 for APIs.',
    numberNotes: 'Arabic digits; prefer consistent thousand separators in product UI.',
    currencyNotes: 'Kenyan shilling (KSh / KES).',
    culturalNotes:
      'Swahili + English bilingual contexts; Sheng-influenced urban Swahili may appear in informal copy.',
  },
  TZ: {
    primaryLanguages: ['sw', 'en'],
    bcp47Tags: ['sw-TZ', 'en-TZ'],
    relatedDialectCodes: ['sw-tz'],
    relatedAccentCodes: [],
    dateNotes: 'DMY; Monday week start common in formal contexts.',
    numberNotes: 'Arabic digits; align with sw locale pack formatting.',
    currencyNotes: 'Tanzanian shilling (TSh / TZS).',
    culturalNotes:
      'Coastal Swahili norms; respectful address (Mheshimiwa) in public-sector copy.',
  },
  NG: {
    primaryLanguages: ['en', 'yo', 'ha'],
    bcp47Tags: ['en-NG', 'yo-NG', 'ha-NG'],
    relatedDialectCodes: ['en-ng', 'yo-ng', 'ha-ng'],
    relatedAccentCodes: ['en-ng', 'ha-ng'],
    dateNotes: 'DMY common in administration.',
    numberNotes: 'Arabic digits; naira amounts often use ₦.',
    currencyNotes: 'Nigerian naira (₦ / NGN).',
    culturalNotes:
      'Multilingual federation; tone marks matter in formal Yoruba; English is a bridge language.',
  },
  GH: {
    primaryLanguages: ['en'],
    bcp47Tags: ['en-GH'],
    relatedDialectCodes: [],
    relatedAccentCodes: ['en-gh'],
    dateNotes: 'DMY common.',
    numberNotes: 'Arabic digits.',
    currencyNotes: 'Ghanaian cedi (GH₵ / GHS).',
    culturalNotes:
      'English official; local languages appear in community contexts — keep brand names stable.',
  },
  ZA: {
    primaryLanguages: ['en', 'zu', 'af'],
    bcp47Tags: ['en-ZA', 'zu-ZA', 'af-ZA'],
    relatedDialectCodes: ['en-za', 'zu-za', 'af-za'],
    relatedAccentCodes: ['en-za', 'zu-za'],
    dateNotes: 'YMD often in formal/business; DMY also appears — prefer ISO in APIs.',
    numberNotes: 'Space or comma thousands; period decimal in many EN contexts.',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes:
      'Multiple official languages; English, isiZulu, and Afrikaans are common product targets.',
  },
  EG: {
    primaryLanguages: ['ar'],
    bcp47Tags: ['ar-EG'],
    relatedDialectCodes: ['ar-eg'],
    relatedAccentCodes: ['ar-eg'],
    dateNotes: 'DMY; Hijri may appear in cultural contexts — keep civil Gregorian for APIs.',
    numberNotes: 'Arabic-Indic or Western digits depending on audience; prefer Western digits in APIs.',
    currencyNotes: 'Egyptian pound (E£ / EGP).',
    culturalNotes: 'Egyptian Arabic differs from MSA; RTL layout required for Arabic UI.',
  },
  MA: {
    primaryLanguages: ['ar', 'fr'],
    bcp47Tags: ['ar-MA', 'fr-MA'],
    relatedDialectCodes: ['ar-ma'],
    relatedAccentCodes: [],
    dateNotes: 'DMY common in French/Arabic admin contexts.',
    numberNotes: 'French-influenced decimal comma may appear in FR copy.',
    currencyNotes: 'Moroccan dirham (MAD).',
    culturalNotes: 'Darija + French bilingual markets; MSA for formal Arabic.',
  },
  SN: {
    primaryLanguages: ['fr'],
    bcp47Tags: ['fr-SN'],
    relatedDialectCodes: [],
    relatedAccentCodes: ['fr-sn'],
    dateNotes: 'DMY (French).',
    numberNotes: 'French decimal comma conventions in FR copy.',
    currencyNotes: 'West African CFA franc (XOF).',
    culturalNotes: 'French official; Wolof strongly present in spoken contexts.',
  },
  CI: {
    nameEn: "Côte d'Ivoire",
    primaryLanguages: ['fr'],
    bcp47Tags: ['fr-CI'],
    relatedDialectCodes: [],
    relatedAccentCodes: ['fr-ci'],
    dateNotes: 'DMY (French).',
    numberNotes: 'French decimal conventions in FR copy.',
    currencyNotes: 'West African CFA franc (XOF).',
    culturalNotes: 'French official; Nouchi influences informal speech.',
  },
  ET: {
    primaryLanguages: ['am', 'en'],
    bcp47Tags: ['am-ET', 'en-ET'],
    relatedDialectCodes: ['am-et'],
    relatedAccentCodes: [],
    dateNotes: 'Ethiopian calendar may appear culturally; use Gregorian ISO in APIs.',
    numberNotes: 'Arabic digits in Latin UI; Ethiopic script for Amharic.',
    currencyNotes: 'Ethiopian birr (Br / ETB).',
    culturalNotes: 'Amharic primary; respectful forms and script fidelity matter.',
  },
};

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

type LocaleIndex = {
  languages: Set<string>;
  tags: Set<string>;
  currencies: Set<string>;
};

function buildLocaleIndex(): Map<string, LocaleIndex> {
  const map = new Map<string, LocaleIndex>();
  for (const pack of LOCALE_PACK_SEEDS) {
    const country = regionFromBcp47(pack.bcp47);
    if (!country) continue;
    let entry = map.get(country);
    if (!entry) {
      entry = { languages: new Set(), tags: new Set(), currencies: new Set() };
      map.set(country, entry);
    }
    entry.languages.add(languageFromBcp47(pack.bcp47));
    entry.tags.add(pack.bcp47);
    if (pack.currencyCode) entry.currencies.add(pack.currencyCode);
  }
  return map;
}

function composePack(country: IsoCountryDef, localeIndex: Map<string, LocaleIndex>): CountryPackSeed {
  const locale = localeIndex.get(country.code);
  const override = CURATED_OVERRIDES[country.code];

  const fromLocales = locale ? [...locale.languages].filter((c) => LANGUAGE_CODES.has(c)) : [];
  const fromOfficial = country.officialLanguages.filter((c) => LANGUAGE_CODES.has(c));

  let primaryLanguages =
    override?.primaryLanguages ??
    (fromOfficial.length > 0 ? fromOfficial : fromLocales.slice(0, 6));

  const bcp47FromLocales = locale ? [...locale.tags].sort() : [];
  let bcp47Tags =
    override?.bcp47Tags ??
    (bcp47FromLocales.length > 0
      ? bcp47FromLocales
      : primaryLanguages.map((lang) => `${lang}-${country.code}`));

  if (primaryLanguages.length === 0 && bcp47Tags.length === 0) {
    primaryLanguages = [];
    bcp47Tags = [];
  }

  const currencyCode = country.currencyCode;
  const currencyFromLocale = locale ? [...locale.currencies][0] : undefined;

  return {
    code: country.code,
    nameEn: override?.nameEn ?? country.nameEn,
    region: override?.region ?? country.region,
    currencyCode: override?.currencyCode ?? currencyFromLocale ?? currencyCode,
    primaryLanguages,
    bcp47Tags,
    relatedDialectCodes: override?.relatedDialectCodes ?? [],
    relatedAccentCodes: override?.relatedAccentCodes ?? [],
    dateNotes:
      override?.dateNotes ??
      'Prefer Gregorian ISO 8601 in APIs; follow local administrative order in product copy.',
    numberNotes:
      override?.numberNotes ??
      'Arabic digits in digital UIs unless orthography traditionally uses another numeral system.',
    currencyNotes:
      override?.currencyNotes ??
      `${override?.currencyCode ?? currencyFromLocale ?? currencyCode} — local market currency for ${country.nameEn}.`,
    culturalNotes:
      override?.culturalNotes ??
      (primaryLanguages.length > 0
        ? `Country pack for ${country.nameEn} (${country.region}). Composes registry locale packs where seeded — not a claim of full CLDR dialect coverage.`
        : `Country pack for ${country.nameEn} (${country.region}). Listed for residency and regional routing; no language locale packs seeded for this country yet.`),
  };
}

/**
 * Full ISO country pack catalog (~200+).
 * Africa-first ordering; composed from language locale packs + official-language hints.
 * Curated African priority packs keep richer cultural notes.
 * Honest: not a CLDR dump or billing SKU catalog.
 */
export const COUNTRY_PACK_SEEDS: CountryPackSeed[] = (() => {
  const localeIndex = buildLocaleIndex();
  return [...ISO_COUNTRIES]
    .sort(africaFirstCountrySort)
    .map((c) => composePack(c, localeIndex));
})();

export const COUNTRY_PACK_COUNT = COUNTRY_PACK_SEEDS.length;
