import { LOCALE_PACK_SEEDS } from '../locales/locale-pack-seeds';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import {
  GHANA_BCP47_TAGS,
  GHANA_PRIMARY_LANGUAGE_CODES,
  GHANA_RELATED_ACCENT_CODES,
  GHANA_RELATED_DIALECT_CODES,
} from '../ghana/ghana-language-stack';
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
    primaryLanguages: ['en', 'yo', 'ha', 'ig', 'pcm'],
    bcp47Tags: ['en-NG', 'yo-NG', 'ha-NG', 'ig-NG', 'pcm-NG'],
    relatedDialectCodes: ['en-ng', 'yo-ng', 'ha-ng', 'ig-ng'],
    relatedAccentCodes: ['en-ng', 'ha-ng'],
    dateNotes: 'DMY common in administration.',
    numberNotes: 'Arabic digits; naira amounts often use ₦.',
    currencyNotes: 'Nigerian naira (₦ / NGN).',
    culturalNotes:
      'Multilingual federation; tone marks matter in formal Yoruba; English is a bridge language.',
  },
  GH: {
    primaryLanguages: [...GHANA_PRIMARY_LANGUAGE_CODES],
    bcp47Tags: [...GHANA_BCP47_TAGS],
    relatedDialectCodes: [...GHANA_RELATED_DIALECT_CODES],
    relatedAccentCodes: [...GHANA_RELATED_ACCENT_CODES],
    dateNotes: 'DMY common.',
    numberNotes: 'Arabic digits.',
    currencyNotes: 'Ghanaian cedi (GH₵ / GHS).',
    culturalNotes:
      'English is the official bridge language. Translate and speak across Akan (Asante/Akuapem Twi, Fante), Ewe, Ga, Dangme, Dagbani, Dagaare, Gonja, Kasem, Farefare, Nzema, Mampruli, Buli, Konkomba, Sisaala, Wali, and Ghana Hausa — with Ghanaian English and Ghanaian Pidgin accent identities. Keep brand names and place names stable.',
  },
  ZA: {
    primaryLanguages: ['en', 'zu', 'xh', 'af', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr'],
    bcp47Tags: [
      'en-ZA',
      'zu-ZA',
      'xh-ZA',
      'af-ZA',
      'nso-ZA',
      'tn-ZA',
      'st-ZA',
      'ts-ZA',
      'ss-ZA',
      've-ZA',
      'nr-ZA',
    ],
    relatedDialectCodes: ['en-za', 'zu-za', 'xh-za', 'af-za'],
    relatedAccentCodes: ['en-za', 'zu-za', 'xh-za'],
    dateNotes: 'YMD often in formal/business; DMY also appears — prefer ISO in APIs.',
    numberNotes: 'Space or comma thousands; period decimal in many EN contexts.',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes:
      'Eleven official languages; English, isiZulu, isiXhosa, Afrikaans and Sesotho/Setswana corridors are priority product targets. Do not substitute Afrikaans for Nguni languages.',
  },
  RW: {
    primaryLanguages: ['rw', 'en', 'fr'],
    bcp47Tags: ['rw-RW', 'en-RW', 'fr-RW'],
    relatedDialectCodes: ['rw-rw'],
    relatedAccentCodes: [],
    dateNotes: 'DMY common in administration.',
    numberNotes: 'Arabic digits; align FR/EN formatting to audience.',
    currencyNotes: 'Rwandan franc (RWF) — zero-decimal in practice for product amounts.',
    culturalNotes:
      'Kinyarwanda + English + French trilingual contexts; respectful address in public-sector copy.',
  },
  UG: {
    primaryLanguages: ['en', 'sw', 'lg'],
    bcp47Tags: ['en-UG', 'sw-UG', 'lg-UG'],
    relatedDialectCodes: ['en-ug', 'sw-ug', 'lg-ug'],
    relatedAccentCodes: ['en-ug'],
    dateNotes: 'DMY common.',
    numberNotes: 'Arabic digits.',
    currencyNotes: 'Ugandan shilling (UGX) — zero-decimal currency.',
    culturalNotes:
      'English bridge with Luganda and Swahili widely used; keep place and clan names stable.',
  },
  ZW: {
    primaryLanguages: ['en', 'sn', 'nd'],
    bcp47Tags: ['en-ZW', 'sn-ZW', 'nd-ZW'],
    relatedDialectCodes: ['en-zw', 'sn-zw', 'nd-zw'],
    relatedAccentCodes: ['en-zw'],
    dateNotes: 'DMY common.',
    numberNotes: 'Arabic digits.',
    currencyNotes: 'USD widely used in product pricing; ZiG may appear in local contexts.',
    culturalNotes:
      'English bridge with Shona and Northern Ndebele; do not conflate Ndebele varieties across borders.',
  },
  ZM: {
    primaryLanguages: ['en', 'bem', 'ny', 'loz', 'toi'],
    bcp47Tags: ['en-ZM', 'bem-ZM', 'ny-ZM', 'loz-ZM', 'toi-ZM'],
    relatedDialectCodes: ['en-zm', 'bem-zm'],
    relatedAccentCodes: ['en-zm'],
    dateNotes: 'DMY common.',
    numberNotes: 'Arabic digits.',
    currencyNotes: 'Zambian kwacha (ZMW).',
    culturalNotes:
      'English bridge with Bemba and Nyanja/Chewa widely used in urban product copy.',
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
  // —— LATAM ——
  MX: {
    primaryLanguages: ['es', 'en', 'nah'],
    bcp47Tags: ['es-MX', 'en-MX', 'nah-MX'],
    relatedDialectCodes: ['es-mx', 'nah-mx'],
    relatedAccentCodes: ['es-mx', 'en-mx'],
    culturalNotes:
      'Mexican Spanish (Mexico City / regional) is the primary variety; Nahuatl and other Indigenous languages require community care. English is a bridge — Mexican English, not US English.',
  },
  BR: {
    primaryLanguages: ['pt', 'en'],
    bcp47Tags: ['pt-BR', 'en-BR'],
    relatedDialectCodes: ['pt-br'],
    relatedAccentCodes: ['pt-br', 'en-br'],
    culturalNotes:
      'Brazilian Portuguese (Paulista, Carioca, Nordestino, …) — not European Portuguese. Brazilian English is the English bridge variety.',
  },
  AR: {
    primaryLanguages: ['es', 'en'],
    bcp47Tags: ['es-AR', 'en-AR'],
    relatedDialectCodes: ['es-ar'],
    relatedAccentCodes: ['es-ar', 'en-ar'],
    culturalNotes: 'Rioplatense Spanish with voseo; distinct from Mexican and Andean Spanish.',
  },
  CO: {
    primaryLanguages: ['es', 'en'],
    bcp47Tags: ['es-CO', 'en-CO'],
    relatedDialectCodes: ['es-co'],
    relatedAccentCodes: ['es-co', 'en-co'],
    culturalNotes: 'Colombian Spanish — Bogotá Andean, coastal, and Paisa varieties.',
  },
  PE: {
    primaryLanguages: ['es', 'qu', 'en'],
    bcp47Tags: ['es-PE', 'qu-PE', 'en-PE'],
    relatedDialectCodes: ['es-pe', 'qu-pe'],
    relatedAccentCodes: ['es-pe', 'en-pe'],
    culturalNotes: 'Peruvian Spanish plus Quechua; Indigenous languages need community consent for cultural corpora.',
  },
  PY: {
    primaryLanguages: ['es', 'gn', 'en'],
    bcp47Tags: ['es-PY', 'gn-PY', 'en-PY'],
    relatedDialectCodes: ['es-py', 'gn-py'],
    relatedAccentCodes: ['es-py'],
    culturalNotes: 'Bilingual Spanish/Guarani daily life; Jopará mixing is common.',
  },
  HT: {
    primaryLanguages: ['ht', 'fr', 'en'],
    bcp47Tags: ['ht-HT', 'fr-HT', 'en-HT'],
    relatedDialectCodes: ['ht-ht'],
    relatedAccentCodes: ['ht-ht'],
    culturalNotes: 'Haitian Creole is the everyday language; French is formal register.',
  },
  JM: {
    primaryLanguages: ['en', 'es'],
    bcp47Tags: ['en-JM', 'es-JM'],
    relatedDialectCodes: ['en-jm'],
    relatedAccentCodes: ['en-jm'],
    culturalNotes:
      'Jamaican English is the country-identifying bridge (distinct from Patwa). Spanish is a Caribbean contact/tourism corridor language — not an official-language claim.',
  },
  TT: {
    primaryLanguages: ['en', 'es'],
    bcp47Tags: ['en-TT', 'es-TT'],
    relatedDialectCodes: ['en-tt'],
    relatedAccentCodes: ['en-tt'],
    culturalNotes:
      'Trinidadian English is country-identifying; Spanish is a Caribbean contact corridor language.',
  },
  GY: {
    primaryLanguages: ['en', 'es'],
    bcp47Tags: ['en-GY', 'es-GY'],
    relatedDialectCodes: ['en-gy'],
    relatedAccentCodes: ['en-gy'],
    culturalNotes:
      'Guyanese English is country-identifying; Spanish is a regional contact corridor language with neighboring LATAM markets.',
  },
  BZ: {
    primaryLanguages: ['en', 'es'],
    bcp47Tags: ['en-BZ', 'es-BZ'],
    relatedDialectCodes: ['en-bz'],
    relatedAccentCodes: ['en-bz'],
    culturalNotes:
      'Belizean English is country-identifying; Spanish is widely used as a contact language alongside English.',
  },
  // —— SEA ——
  PH: {
    primaryLanguages: ['en', 'fil', 'tl', 'ceb'],
    bcp47Tags: ['en-PH', 'fil-PH', 'tl-PH', 'ceb-PH'],
    relatedDialectCodes: ['en-ph', 'tl-ph', 'ceb-ph'],
    relatedAccentCodes: ['en-ph', 'tl-ph', 'ceb-ph'],
    culturalNotes:
      'Filipino English plus Tagalog/Filipino and Cebuano (Visayas). Po/opo respect particles; do not collapse Visayan into Tagalog.',
  },
  ID: {
    primaryLanguages: ['id', 'jv', 'su', 'en'],
    bcp47Tags: ['id-ID', 'jv-ID', 'su-ID', 'en-ID'],
    relatedDialectCodes: ['id-id', 'jv-id', 'su-id'],
    relatedAccentCodes: ['id-id', 'en-id'],
    culturalNotes:
      'Bahasa Indonesia bridges many islands; Javanese and Sundanese are major regional languages with their own speech identity.',
  },
  TH: {
    primaryLanguages: ['th', 'en'],
    bcp47Tags: ['th-TH', 'en-TH'],
    relatedDialectCodes: ['th-th'],
    relatedAccentCodes: ['th-th', 'en-th'],
    culturalNotes: 'Central Thai (Bangkok) plus Northern, Isan, and Southern varieties — polite particles matter.',
  },
  VN: {
    primaryLanguages: ['vi', 'en'],
    bcp47Tags: ['vi-VN', 'en-VN'],
    relatedDialectCodes: ['vi-vn'],
    relatedAccentCodes: ['vi-vn', 'en-vn'],
    culturalNotes: 'Northern (Hanoi), Central, and Southern (Saigon) Vietnamese dialects.',
  },
  MY: {
    primaryLanguages: ['ms', 'en'],
    bcp47Tags: ['ms-MY', 'en-MY'],
    relatedDialectCodes: ['ms-my'],
    relatedAccentCodes: ['ms-my', 'en-my'],
    culturalNotes: 'Malaysian Malay and Malaysian English — distinct from Singapore varieties.',
  },
  SG: {
    primaryLanguages: ['en', 'ms', 'zh'],
    bcp47Tags: ['en-SG', 'ms-SG', 'zh-SG'],
    relatedDialectCodes: ['en-sg', 'ms-sg'],
    relatedAccentCodes: ['en-sg'],
    culturalNotes:
      'Singaporean English (Standard vs Singlish), Malay, and Mandarin — four official languages; English is the primary bridge.',
  },
  // —— Middle East ——
  SA: {
    primaryLanguages: ['ar', 'en'],
    bcp47Tags: ['ar-SA', 'en-SA'],
    relatedDialectCodes: ['ar-sa'],
    relatedAccentCodes: ['ar-sa', 'en-sa'],
    culturalNotes: 'Najdi, Hijazi, and Gulf Arabic dialects; MSA for formal. Saudi English is the English bridge.',
  },
  AE: {
    primaryLanguages: ['ar', 'en'],
    bcp47Tags: ['ar-AE', 'en-AE'],
    relatedDialectCodes: ['ar-ae'],
    relatedAccentCodes: ['ar-ae', 'en-ae'],
    culturalNotes: 'Emirati/Gulf Arabic in a highly multilingual Gulf context; Emirati English for the bridge.',
  },
  IQ: {
    primaryLanguages: ['ar', 'ckb', 'en'],
    bcp47Tags: ['ar-IQ', 'ckb-IQ', 'en-IQ'],
    relatedDialectCodes: ['ar-iq', 'ckb-iq'],
    relatedAccentCodes: ['ar-iq', 'en-iq'],
    culturalNotes: 'Iraqi Arabic plus Sorani Kurdish; Iraqi English for the bridge.',
  },
  LB: {
    primaryLanguages: ['ar', 'en', 'fr'],
    bcp47Tags: ['ar-LB', 'en-LB', 'fr-LB'],
    relatedDialectCodes: ['ar-lb'],
    relatedAccentCodes: ['ar-lb', 'en-lb'],
    culturalNotes: 'Lebanese Arabic with frequent French/English trilingual contexts.',
  },
  IL: {
    primaryLanguages: ['he', 'ar', 'en'],
    bcp47Tags: ['he-IL', 'ar-IL', 'en-IL'],
    relatedDialectCodes: ['he-il', 'ar-il'],
    relatedAccentCodes: ['he-il', 'en-il'],
    culturalNotes: 'Modern Israeli Hebrew plus Levantine Arabic; Israeli English for the bridge.',
  },
  IR: {
    primaryLanguages: ['fa', 'en'],
    bcp47Tags: ['fa-IR', 'en-IR'],
    relatedDialectCodes: ['fa-ir'],
    relatedAccentCodes: ['fa-ir', 'en-ir'],
    culturalNotes: 'Tehrani Persian with taarof politeness; Iranian English for the bridge.',
  },
  TR: {
    primaryLanguages: ['tr', 'ku', 'en'],
    bcp47Tags: ['tr-TR', 'ku-TR', 'en-TR'],
    relatedDialectCodes: ['tr-tr', 'ku-tr'],
    relatedAccentCodes: ['tr-tr', 'en-tr'],
    culturalNotes: 'Istanbul Turkish plus Kurmanji Kurdish; Turkish English for the bridge.',
  },
  // —— Anglosphere (country- and culture-identifying Englishes) ——
  US: {
    primaryLanguages: ['en', 'es', 'chr', 'nv', 'haw', 'hmn'],
    bcp47Tags: ['en-US', 'es-US', 'chr-US', 'nv-US', 'haw-US', 'hmn-US'],
    relatedDialectCodes: ['en-us-general-american', 'es-us'],
    relatedAccentCodes: ['en-us', 'es-us'],
    culturalNotes:
      'General American English is the product baseline — distinct from British, Canadian, Australian, and New Zealand. Regional and ethnic Englishes (Southern, AAVE, Chicano English contact) are separate identity packs. Spanish is the major community bridge; Indigenous languages require community consent for cultural corpora.',
  },
  CA: {
    primaryLanguages: ['en', 'fr', 'iu'],
    bcp47Tags: ['en-CA', 'fr-CA', 'iu-CA'],
    relatedDialectCodes: ['en-ca', 'fr-ca'],
    relatedAccentCodes: ['en-ca', 'fr-ca'],
    culturalNotes:
      'Canadian English is country-identifying (Canadian raising, lexicon) — not interchangeable with General American. Québécois French (fr-CA) is the major French variety; Inuktitut and other Indigenous languages require community consent.',
  },
  AU: {
    primaryLanguages: ['en', 'zh'],
    bcp47Tags: ['en-AU', 'zh-AU'],
    relatedDialectCodes: ['en-au'],
    relatedAccentCodes: ['en-au'],
    culturalNotes:
      'Australian English is country-identifying — distinct from British and New Zealand English. Aboriginal English contact is a separate cultural pack; Mandarin is a major community corridor language.',
  },
  NZ: {
    primaryLanguages: ['en', 'mi'],
    bcp47Tags: ['en-NZ', 'mi-NZ'],
    relatedDialectCodes: ['en-nz', 'mi-nz'],
    relatedAccentCodes: ['en-nz', 'mi-nz'],
    culturalNotes:
      'New Zealand English is country-identifying with Māori loans — distinct from Australian English. Te Reo Māori is an official language; Pasifika English contact is a separate cultural pack.',
  },
  GB: {
    primaryLanguages: ['en', 'cy', 'gd'],
    bcp47Tags: ['en-GB', 'cy-GB', 'gd-GB'],
    relatedDialectCodes: ['en-gb-british', 'cy-gb', 'gd-gb'],
    relatedAccentCodes: ['en-gb', 'cy-gb', 'gd-gb'],
    culturalNotes:
      'British English is the UK baseline — not American/Australian. Scottish, Welsh, and Northern Englishes are separate cultural packs; Welsh and Scottish Gaelic are national languages requiring community care.',
  },
  IE: {
    primaryLanguages: ['en', 'ga'],
    bcp47Tags: ['en-IE', 'ga-IE'],
    relatedDialectCodes: ['en-ie', 'ga-ie'],
    relatedAccentCodes: ['en-ie', 'ga-ie'],
    culturalNotes:
      'Irish English (Hiberno-English) is country-identifying — distinct from British English. Irish (Gaeilge) is an official language alongside English.',
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

  // Curated overrides keep priority ordering; always union locale/official languages
  // so country↔corridor catalogs are not truncated by thin curated lists.
  const baseLanguages =
    override?.primaryLanguages ??
    (fromOfficial.length > 0 ? fromOfficial : fromLocales.slice(0, 6));
  let primaryLanguages = [
    ...new Set([...baseLanguages, ...fromOfficial, ...fromLocales]),
  ].filter((c) => LANGUAGE_CODES.has(c));

  const bcp47FromLocales = locale ? [...locale.tags].sort() : [];
  const baseTags =
    override?.bcp47Tags ??
    (bcp47FromLocales.length > 0
      ? bcp47FromLocales
      : primaryLanguages.map((lang) => `${lang}-${country.code}`));
  let bcp47Tags = [...new Set([...baseTags, ...bcp47FromLocales])];

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
