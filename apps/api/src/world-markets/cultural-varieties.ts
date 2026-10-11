import type { AccentIdentitySeed } from '../accents/accent-identity-seeds';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import {
  latamLanguageSeed,
  menaLanguageSeed,
  seaLanguageSeed,
} from '../regional-language-registry/region-catalogs';
import type { RegionalLanguageEntry } from '../regional-language-registry/regional-language-registry.types';
import type { WorldProductRegion } from './region-defs';

/**
 * Per-country languages, dialects, accents, and cultural context for
 * LATAM / SEA / Middle East product markets.
 */

export type CulturalVariety = {
  languageCode: string;
  languageName: string;
  varietyName: string;
  dialects: string[];
  accents: string[];
  bcp47?: string;
  accentIdentityId?: string;
  /** When true, corridor labels use varietyName instead of the generic language name. */
  primaryLabel: boolean;
  lifestyleNotes?: string;
  culturalNotes?: string;
};

type MarketInput = {
  code: string;
  nameEn: string;
  region: string;
  worldRegion: WorldProductRegion;
  localLanguages: string[];
  bridgeLanguages: string[];
};

const LANGUAGE_BY_CODE = new Map(LANGUAGE_SEEDS.map((l) => [l.code, l]));

/** Country-specific primary varieties (Spanish/Arabic/Portuguese/etc.). */
const CURATED_VARIETIES: Record<string, CulturalVariety[]> = {
  MX: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Mexican Spanish',
      dialects: ['Mexico City Spanish', 'Northern Mexican', 'Coastal Mexican'],
      accents: ['Mexico City Spanish (spoken)'],
      bcp47: 'es-MX',
      accentIdentityId: 'mx-spanish',
      primaryLabel: true,
      lifestyleNotes: 'Compadrazgo ties; saint-day and family calendars',
      culturalNotes: 'Prefer es-MX over generic Spanish for product copy and TTS.',
    },
    {
      languageCode: 'nah',
      languageName: 'Nahuatl',
      varietyName: 'Nahuatl (Mexico)',
      dialects: ['Central Nahuatl', 'Huasteca'],
      accents: ['Central Nahuatl (spoken)'],
      bcp47: 'nah-MX',
      primaryLabel: true,
      culturalNotes: 'Many varieties — catalog for routing, not a single dialect claim.',
    },
  ],
  BR: [
    {
      languageCode: 'pt',
      languageName: 'Portuguese',
      varietyName: 'Brazilian Portuguese',
      dialects: ['Paulista', 'Carioca', 'Nordestino', 'Gaúcho'],
      accents: ['São Paulo Portuguese (spoken)', 'Rio Portuguese (spoken)'],
      bcp47: 'pt-BR',
      accentIdentityId: 'br-portuguese',
      primaryLabel: true,
      lifestyleNotes: 'Weekend churrasco; Carnival season',
      culturalNotes: 'pt-BR is the LATAM default Portuguese — not European Portuguese.',
    },
  ],
  AR: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Rioplatense Spanish',
      dialects: ['Buenos Aires Spanish', 'Rioplatense voseo'],
      accents: ['Buenos Aires Spanish (spoken)'],
      bcp47: 'es-AR',
      accentIdentityId: 'ar-rioplatense',
      primaryLabel: true,
      lifestyleNotes: 'Late dinners; mate sharing',
      culturalNotes: 'Voseo and sheísmo/zheísmo mark Rioplatense identity.',
    },
  ],
  CO: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Colombian Spanish',
      dialects: ['Bogotá Andean', 'Coastal Caribbean', 'Paisa'],
      accents: ['Bogotá Spanish (spoken)'],
      bcp47: 'es-CO',
      accentIdentityId: 'co-colombian-spanish',
      primaryLabel: true,
      culturalNotes: 'Andean Bogotá register often preferred for national media.',
    },
  ],
  CL: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Chilean Spanish',
      dialects: ['Santiago Spanish', 'Southern Chilean'],
      accents: ['Santiago Spanish (spoken)'],
      bcp47: 'es-CL',
      accentIdentityId: 'cl-chilean-spanish',
      primaryLabel: true,
      culturalNotes: 'Distinct vocabulary and aspiration patterns — not interchangeable with Mexican or Rioplatense.',
    },
  ],
  PE: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Peruvian Spanish',
      dialects: ['Lima coastal', 'Andean Spanish'],
      accents: ['Lima Spanish (spoken)'],
      bcp47: 'es-PE',
      accentIdentityId: 'pe-peruvian-spanish',
      primaryLabel: true,
    },
    {
      languageCode: 'qu',
      languageName: 'Quechua',
      varietyName: 'Quechua (Peru)',
      dialects: ['Cusco Quechua', 'Southern Quechua'],
      accents: ['Cusco Quechua (spoken)'],
      bcp47: 'qu-PE',
      accentIdentityId: 'pe-quechua',
      primaryLabel: true,
      culturalNotes: 'Indigenous language — community care for cultural corpora.',
    },
  ],
  BO: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Bolivian Spanish',
      dialects: ['La Paz Andean', 'Santa Cruz lowland'],
      accents: ['La Paz Spanish (spoken)'],
      bcp47: 'es-BO',
      accentIdentityId: 'bo-bolivian-spanish',
      primaryLabel: true,
    },
    {
      languageCode: 'ay',
      languageName: 'Aymara',
      varietyName: 'Aymara (Bolivia)',
      dialects: ['Central Aymara', 'Southern Aymara'],
      accents: ['La Paz Aymara (spoken)'],
      bcp47: 'ay-BO',
      accentIdentityId: 'bo-aymara',
      primaryLabel: true,
    },
    {
      languageCode: 'qu',
      languageName: 'Quechua',
      varietyName: 'Quechua (Bolivia)',
      dialects: ['Bolivian Quechua'],
      accents: ['Bolivian Quechua (spoken)'],
      bcp47: 'qu-BO',
      accentIdentityId: 'bo-quechua',
      primaryLabel: true,
    },
  ],
  PY: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Paraguayan Spanish',
      dialects: ['Asunción Spanish', 'Jopará contact'],
      accents: ['Asunción Spanish (spoken)'],
      bcp47: 'es-PY',
      accentIdentityId: 'py-paraguayan-spanish',
      primaryLabel: true,
    },
    {
      languageCode: 'gn',
      languageName: 'Guarani',
      varietyName: 'Paraguayan Guarani',
      dialects: ['Paraguayan Guarani', 'Jopará bridge'],
      accents: ['Asunción Guarani (spoken)'],
      bcp47: 'gn-PY',
      accentIdentityId: 'py-guarani',
      primaryLabel: true,
      culturalNotes: 'Co-official; bilingual Guarani/Spanish daily life is the norm.',
    },
  ],
  HT: [
    {
      languageCode: 'ht',
      languageName: 'Haitian Creole',
      varietyName: 'Haitian Creole',
      dialects: ['Standard Kreyòl', 'Northern'],
      accents: ['Port-au-Prince Kreyòl (spoken)'],
      bcp47: 'ht-HT',
      accentIdentityId: 'ht-creole',
      primaryLabel: true,
      culturalNotes: 'Primary everyday language; French is formal register.',
    },
    {
      languageCode: 'fr',
      languageName: 'French',
      varietyName: 'Haitian French',
      dialects: ['Administrative French', 'Formal Haitian French'],
      accents: ['Port-au-Prince French (spoken)'],
      bcp47: 'fr-HT',
      accentIdentityId: 'ht-french',
      primaryLabel: true,
    },
  ],
  JM: [
    {
      languageCode: 'en',
      languageName: 'English',
      varietyName: 'Jamaican English',
      dialects: ['Jamaican English', 'Jamaican Patwa contact'],
      accents: ['Kingston English (spoken)'],
      bcp47: 'en-JM',
      accentIdentityId: 'jm-jamaican_english',
      primaryLabel: true,
      lifestyleNotes: 'Kingston media and professional registers',
      culturalNotes:
        'Jamaican English is the product bridge variety — distinct from US/UK English and from Jamaican Patwa/Creole (spoken widely; not yet a separate registry language code).',
    },
  ],
  TT: [
    {
      languageCode: 'en',
      languageName: 'English',
      varietyName: 'Trinidadian English',
      dialects: ['Trinidadian English', 'Tobago English', 'Trinidadian Creole contact'],
      accents: ['Port of Spain English (spoken)'],
      bcp47: 'en-TT',
      accentIdentityId: 'tt-trinidadian_english',
      primaryLabel: true,
      culturalNotes:
        'Trinidadian English is country-identifying; Creole contact influences informal speech.',
    },
  ],
  GY: [
    {
      languageCode: 'en',
      languageName: 'English',
      varietyName: 'Guyanese English',
      dialects: ['Guyanese English', 'Guyanese Creole contact'],
      accents: ['Georgetown English (spoken)'],
      bcp47: 'en-GY',
      accentIdentityId: 'gy-guyanese_english',
      primaryLabel: true,
      culturalNotes:
        'Guyanese English is the product bridge variety; Creole contact is common in informal speech.',
    },
  ],
  CU: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Cuban Spanish',
      dialects: ['Havana Spanish', 'Eastern Cuban'],
      accents: ['Havana Spanish (spoken)'],
      bcp47: 'es-CU',
      accentIdentityId: 'cu-cuban-spanish',
      primaryLabel: true,
      culturalNotes: 'Caribbean Spanish — aspiration and rhythm differ from Mexican/Andean.',
    },
  ],
  DO: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Dominican Spanish',
      dialects: ['Santo Domingo Spanish', 'Cibaeño'],
      accents: ['Santo Domingo Spanish (spoken)'],
      bcp47: 'es-DO',
      accentIdentityId: 'do-dominican-spanish',
      primaryLabel: true,
    },
  ],
  PR: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Puerto Rican Spanish',
      dialects: ['San Juan Spanish', 'Island Spanish'],
      accents: ['San Juan Spanish (spoken)'],
      bcp47: 'es-PR',
      accentIdentityId: 'pr-puerto-rican-spanish',
      primaryLabel: true,
      culturalNotes: 'Bilingual Spanish/English contexts are common.',
    },
  ],
  VE: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Venezuelan Spanish',
      dialects: ['Caracas Spanish', 'Zulian', 'Andean Venezuelan'],
      accents: ['Caracas Spanish (spoken)'],
      bcp47: 'es-VE',
      accentIdentityId: 've-venezuelan-spanish',
      primaryLabel: true,
    },
  ],
  EC: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Ecuadorian Spanish',
      dialects: ['Quito Andean', 'Guayaquil coastal'],
      accents: ['Quito Spanish (spoken)'],
      bcp47: 'es-EC',
      accentIdentityId: 'ec-ecuadorian-spanish',
      primaryLabel: true,
    },
    {
      languageCode: 'qu',
      languageName: 'Quechua',
      varietyName: 'Quechua (Ecuador)',
      dialects: ['Kichwa', 'Highland Ecuadorian'],
      accents: ['Kichwa (spoken)'],
      bcp47: 'qu-EC',
      accentIdentityId: 'ec-quechua',
      primaryLabel: true,
    },
  ],
  UY: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Uruguayan Spanish',
      dialects: ['Montevideo Rioplatense'],
      accents: ['Montevideo Spanish (spoken)'],
      bcp47: 'es-UY',
      accentIdentityId: 'uy-uruguayan-spanish',
      primaryLabel: true,
      culturalNotes: 'Shares Rioplatense features with Argentine Spanish; still country-identifying.',
    },
  ],
  CR: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Costa Rican Spanish',
      dialects: ['Central Valley Spanish', 'Guanacasteco'],
      accents: ['San José Spanish (spoken)'],
      bcp47: 'es-CR',
      accentIdentityId: 'cr-costa-rican-spanish',
      primaryLabel: true,
    },
  ],
  PA: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Panamanian Spanish',
      dialects: ['Panama City Spanish', 'Interior'],
      accents: ['Panama City Spanish (spoken)'],
      bcp47: 'es-PA',
      accentIdentityId: 'pa-panamanian-spanish',
      primaryLabel: true,
    },
  ],
  GT: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Guatemalan Spanish',
      dialects: ['Guatemala City Spanish', 'Western highland contact'],
      accents: ['Guatemala City Spanish (spoken)'],
      bcp47: 'es-GT',
      accentIdentityId: 'gt-guatemalan-spanish',
      primaryLabel: true,
    },
  ],
  HN: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Honduran Spanish',
      dialects: ['Tegucigalpa Spanish', 'Coastal'],
      accents: ['Tegucigalpa Spanish (spoken)'],
      bcp47: 'es-HN',
      accentIdentityId: 'hn-honduran-spanish',
      primaryLabel: true,
    },
  ],
  SV: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Salvadoran Spanish',
      dialects: ['San Salvador Spanish'],
      accents: ['San Salvador Spanish (spoken)'],
      bcp47: 'es-SV',
      accentIdentityId: 'sv-salvadoran-spanish',
      primaryLabel: true,
    },
  ],
  NI: [
    {
      languageCode: 'es',
      languageName: 'Spanish',
      varietyName: 'Nicaraguan Spanish',
      dialects: ['Managua Spanish', 'Caribbean coast contact'],
      accents: ['Managua Spanish (spoken)'],
      bcp47: 'es-NI',
      accentIdentityId: 'ni-nicaraguan-spanish',
      primaryLabel: true,
    },
  ],
  PH: [
    {
      languageCode: 'fil',
      languageName: 'Filipino',
      varietyName: 'Filipino / Tagalog (Manila)',
      dialects: ['Manila Tagalog', 'Batangas', 'Cavite'],
      accents: ['Manila Filipino (spoken)'],
      bcp47: 'fil-PH',
      accentIdentityId: 'ph-tagalog',
      primaryLabel: true,
      lifestyleNotes: 'Po/opo respect particles; Catholic and folk-Catholic references',
    },
    {
      languageCode: 'tl',
      languageName: 'Tagalog',
      varietyName: 'Tagalog (Philippines)',
      dialects: ['Manila Tagalog'],
      accents: ['Manila Tagalog (spoken)'],
      bcp47: 'tl-PH',
      accentIdentityId: 'ph-tagalog',
      primaryLabel: true,
    },
    {
      languageCode: 'ceb',
      languageName: 'Cebuano',
      varietyName: 'Cebuano (Visayas)',
      dialects: ['Cebu City Cebuano', 'Central Visayas'],
      accents: ['Cebuano (spoken)'],
      bcp47: 'ceb-PH',
      accentIdentityId: 'ph-cebuano',
      primaryLabel: true,
      culturalNotes: 'Distinct from Tagalog; Sinulog regional pride.',
    },
  ],
  ID: [
    {
      languageCode: 'id',
      languageName: 'Indonesian',
      varietyName: 'Bahasa Indonesia',
      dialects: ['Standard Indonesian', 'Jakarta colloquial', 'Medan'],
      accents: ['Jakarta Indonesian (spoken)'],
      bcp47: 'id-ID',
      accentIdentityId: 'id-indonesian',
      primaryLabel: true,
      culturalNotes: 'National bridge across many island languages.',
    },
    {
      languageCode: 'jv',
      languageName: 'Javanese',
      varietyName: 'Central Javanese',
      dialects: ['Central Javanese', 'East Javanese'],
      accents: ['Yogyakarta Javanese (spoken)'],
      bcp47: 'jv-ID',
      accentIdentityId: 'id-javanese',
      primaryLabel: true,
    },
    {
      languageCode: 'su',
      languageName: 'Sundanese',
      varietyName: 'Sundanese (West Java)',
      dialects: ['Priangan Sundanese'],
      accents: ['Bandung Sundanese (spoken)'],
      bcp47: 'su-ID',
      accentIdentityId: 'id-sundanese',
      primaryLabel: true,
    },
  ],
  TH: [
    {
      languageCode: 'th',
      languageName: 'Thai',
      varietyName: 'Central Thai (Bangkok)',
      dialects: ['Central Thai', 'Northern Thai (Lanna)', 'Isan', 'Southern Thai'],
      accents: ['Bangkok Thai (spoken)', 'Isan Thai (spoken)'],
      bcp47: 'th-TH',
      accentIdentityId: 'th-central',
      primaryLabel: true,
      lifestyleNotes: 'Wai greeting; polite particles shape address',
    },
  ],
  VN: [
    {
      languageCode: 'vi',
      languageName: 'Vietnamese',
      varietyName: 'Vietnamese (Hanoi / Saigon)',
      dialects: ['Northern (Hanoi)', 'Central (Hue)', 'Southern (Saigon)'],
      accents: ['Hanoi Vietnamese (spoken)', 'Saigon Vietnamese (spoken)'],
      bcp47: 'vi-VN',
      accentIdentityId: 'vn-hanoi',
      primaryLabel: true,
    },
  ],
  MY: [
    {
      languageCode: 'ms',
      languageName: 'Malay',
      varietyName: 'Malaysian Malay (KL)',
      dialects: ['Standard Malay', 'Kelantan', 'Kedah'],
      accents: ['Kuala Lumpur Malay (spoken)'],
      bcp47: 'ms-MY',
      accentIdentityId: 'my-kuala-lumpur',
      primaryLabel: true,
    },
  ],
  SG: [
    {
      languageCode: 'ms',
      languageName: 'Malay',
      varietyName: 'Singapore Malay',
      dialects: ['Standard Malay', 'Colloquial Singapore Malay'],
      accents: ['Singapore Malay (spoken)'],
      bcp47: 'ms-SG',
      accentIdentityId: 'sg-malay',
      primaryLabel: true,
    },
    {
      languageCode: 'zh',
      languageName: 'Chinese (Simplified)',
      varietyName: 'Singapore Mandarin',
      dialects: ['Singapore Mandarin', 'Chinese dialect continuum'],
      accents: ['Singapore Mandarin (spoken)'],
      bcp47: 'zh-SG',
      accentIdentityId: 'sg-mandarin',
      primaryLabel: true,
      culturalNotes: 'English is the primary bridge; Mandarin is one of four official languages.',
    },
  ],
  KH: [
    {
      languageCode: 'km',
      languageName: 'Khmer',
      varietyName: 'Khmer (Phnom Penh)',
      dialects: ['Central Khmer', 'Northern Khmer bridge'],
      accents: ['Phnom Penh Khmer (spoken)'],
      bcp47: 'km-KH',
      accentIdentityId: 'kh-khmer',
      primaryLabel: true,
    },
  ],
  LA: [
    {
      languageCode: 'lo',
      languageName: 'Lao',
      varietyName: 'Lao (Vientiane)',
      dialects: ['Vientiane Lao', 'Northern Lao'],
      accents: ['Vientiane Lao (spoken)'],
      bcp47: 'lo-LA',
      accentIdentityId: 'la-lao',
      primaryLabel: true,
    },
  ],
  MM: [
    {
      languageCode: 'my',
      languageName: 'Burmese',
      varietyName: 'Burmese (Yangon)',
      dialects: ['Standard Burmese', 'Mandalay'],
      accents: ['Yangon Burmese (spoken)'],
      bcp47: 'my-MM',
      accentIdentityId: 'mm-burmese',
      primaryLabel: true,
    },
  ],
  BN: [
    {
      languageCode: 'ms',
      languageName: 'Malay',
      varietyName: 'Brunei Malay',
      dialects: ['Brunei Malay', 'Standard Malay bridge'],
      accents: ['Bandar Seri Begawan Malay (spoken)'],
      bcp47: 'ms-BN',
      accentIdentityId: 'bn-malay',
      primaryLabel: true,
    },
  ],
  TL: [
    {
      languageCode: 'tet',
      languageName: 'Tetum',
      varietyName: 'Tetum (Timor-Leste)',
      dialects: ['Tetum Prasa', 'Tetum Terik'],
      accents: ['Dili Tetum (spoken)'],
      bcp47: 'tet-TL',
      accentIdentityId: 'tl-tetum',
      primaryLabel: true,
    },
    {
      languageCode: 'pt',
      languageName: 'Portuguese',
      varietyName: 'Timorese Portuguese',
      dialects: ['Administrative Portuguese'],
      accents: ['Dili Portuguese (spoken)'],
      bcp47: 'pt-TL',
      accentIdentityId: 'tl-portuguese',
      primaryLabel: true,
    },
  ],
  SA: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Saudi / Gulf Arabic',
      dialects: ['Najdi', 'Hijazi', 'Gulf Arabic', 'MSA'],
      accents: ['Riyadh Arabic (spoken)', 'Jeddah Hijazi (spoken)'],
      bcp47: 'ar-SA',
      accentIdentityId: 'sa-gulf-arabic',
      primaryLabel: true,
      lifestyleNotes: 'Ramadan iftars; majlis visiting',
      culturalNotes: 'MSA for formal; dialect for voice/chat routing.',
    },
  ],
  AE: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Emirati / Gulf Arabic',
      dialects: ['Gulf Arabic', 'MSA'],
      accents: ['Dubai Arabic (spoken)', 'Abu Dhabi Arabic (spoken)'],
      bcp47: 'ar-AE',
      accentIdentityId: 'ae-gulf-arabic',
      primaryLabel: true,
      culturalNotes: 'Highly multilingual Gulf — Arabic remains the national identity language.',
    },
  ],
  QA: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Qatari Arabic',
      dialects: ['Gulf Arabic', 'MSA'],
      accents: ['Doha Arabic (spoken)'],
      bcp47: 'ar-QA',
      accentIdentityId: 'qa-gulf-arabic',
      primaryLabel: true,
    },
  ],
  KW: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Kuwaiti Arabic',
      dialects: ['Gulf Arabic', 'MSA'],
      accents: ['Kuwait City Arabic (spoken)'],
      bcp47: 'ar-KW',
      accentIdentityId: 'kw-gulf-arabic',
      primaryLabel: true,
    },
  ],
  BH: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Bahraini Arabic',
      dialects: ['Gulf Arabic', 'MSA'],
      accents: ['Manama Arabic (spoken)'],
      bcp47: 'ar-BH',
      accentIdentityId: 'bh-gulf-arabic',
      primaryLabel: true,
    },
  ],
  OM: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Omani Arabic',
      dialects: ['Omani Arabic', 'Gulf Arabic', 'MSA'],
      accents: ['Muscat Arabic (spoken)'],
      bcp47: 'ar-OM',
      accentIdentityId: 'om-omani-arabic',
      primaryLabel: true,
    },
  ],
  IQ: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Iraqi Arabic',
      dialects: ['Baghdadi', 'Southern Iraqi', 'MSA'],
      accents: ['Baghdad Arabic (spoken)'],
      bcp47: 'ar-IQ',
      accentIdentityId: 'iq-iraqi-arabic',
      primaryLabel: true,
    },
    {
      languageCode: 'ckb',
      languageName: 'Central Kurdish (Sorani)',
      varietyName: 'Sorani Kurdish (Iraq)',
      dialects: ['Central Sorani'],
      accents: ['Erbil / Sulaymaniyah Sorani (spoken)'],
      bcp47: 'ckb-IQ',
      accentIdentityId: 'iq-sorani',
      primaryLabel: true,
    },
  ],
  IR: [
    {
      languageCode: 'fa',
      languageName: 'Persian (Farsi)',
      varietyName: 'Tehrani Persian',
      dialects: ['Tehrani', 'Isfahani', 'Dari bridge'],
      accents: ['Tehran Persian (spoken)'],
      bcp47: 'fa-IR',
      accentIdentityId: 'ir-persian',
      primaryLabel: true,
      lifestyleNotes: 'Taarof politeness; Nowruz visits',
    },
  ],
  IL: [
    {
      languageCode: 'he',
      languageName: 'Hebrew',
      varietyName: 'Modern Israeli Hebrew',
      dialects: ['Modern Israeli Hebrew', 'Mizrahi-influenced'],
      accents: ['Tel Aviv Hebrew (spoken)'],
      bcp47: 'he-IL',
      accentIdentityId: 'il-hebrew',
      primaryLabel: true,
    },
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Palestinian / Israeli Arabic',
      dialects: ['Levantine Arabic', 'MSA'],
      accents: ['Levantine Arabic (spoken)'],
      bcp47: 'ar-IL',
      accentIdentityId: 'il-levantine-arabic',
      primaryLabel: true,
    },
  ],
  JO: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Jordanian Arabic',
      dialects: ['Ammani Levantine', 'MSA'],
      accents: ['Amman Arabic (spoken)'],
      bcp47: 'ar-JO',
      accentIdentityId: 'jo-levantine-arabic',
      primaryLabel: true,
    },
  ],
  LB: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Lebanese Arabic',
      dialects: ['Beiruti Levantine', 'MSA'],
      accents: ['Beirut Arabic (spoken)'],
      bcp47: 'ar-LB',
      accentIdentityId: 'lb-levantine',
      primaryLabel: true,
      culturalNotes: 'Trilingual Arabic/French/English contexts are common in Beirut.',
    },
  ],
  SY: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Syrian Arabic',
      dialects: ['Damascene Levantine', 'Aleppine', 'MSA'],
      accents: ['Damascus Arabic (spoken)'],
      bcp47: 'ar-SY',
      accentIdentityId: 'sy-levantine-arabic',
      primaryLabel: true,
    },
  ],
  YE: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Yemeni Arabic',
      dialects: ['Sanaani', 'Adeni', 'MSA'],
      accents: ['Sanaa Arabic (spoken)'],
      bcp47: 'ar-YE',
      accentIdentityId: 'ye-yemeni-arabic',
      primaryLabel: true,
    },
  ],
  PS: [
    {
      languageCode: 'ar',
      languageName: 'Arabic',
      varietyName: 'Palestinian Arabic',
      dialects: ['Levantine Arabic', 'MSA'],
      accents: ['Palestinian Arabic (spoken)'],
      bcp47: 'ar-PS',
      accentIdentityId: 'ps-palestinian-arabic',
      primaryLabel: true,
    },
  ],
  TR: [
    {
      languageCode: 'tr',
      languageName: 'Turkish',
      varietyName: 'Istanbul Turkish',
      dialects: ['Istanbul', 'Aegean', 'Eastern Anatolian'],
      accents: ['Istanbul Turkish (spoken)'],
      bcp47: 'tr-TR',
      accentIdentityId: 'tr-istanbul',
      primaryLabel: true,
    },
    {
      languageCode: 'ku',
      languageName: 'Kurdish (Kurmanji)',
      varietyName: 'Kurmanji Kurdish (Türkiye)',
      dialects: ['Kurmanji'],
      accents: ['Kurmanji (spoken)'],
      bcp47: 'ku-TR',
      accentIdentityId: 'tr-kurmanji',
      primaryLabel: true,
    },
  ],
};

function registryEntriesForRegion(worldRegion: WorldProductRegion): RegionalLanguageEntry[] {
  if (worldRegion === 'latam') return latamLanguageSeed();
  if (worldRegion === 'sea') return seaLanguageSeed();
  return menaLanguageSeed();
}

function countryMatchesRegistry(entry: RegionalLanguageEntry, market: MarketInput): boolean {
  const name = market.nameEn.toLowerCase();
  const region = market.region.toLowerCase();
  return entry.regions.some((r) => {
    const rl = r.toLowerCase();
    return (
      rl.includes(name) ||
      name.includes(rl) ||
      rl.includes(region) ||
      (market.worldRegion === 'latam' &&
        (rl.includes('central america') ||
          rl.includes('south america') ||
          rl.includes('caribbean') ||
          rl.includes('mexico'))) ||
      (market.worldRegion === 'sea' && rl.includes('southeast')) ||
      (market.worldRegion === 'mena' &&
        (rl.includes('gulf') || rl.includes('levant') || rl.includes('arab')))
    );
  });
}

export function buildCulturalVarieties(market: MarketInput): CulturalVariety[] {
  const curated = CURATED_VARIETIES[market.code] ?? [];
  const byLang = new Map<string, CulturalVariety>();
  for (const v of curated) byLang.set(`${v.languageCode}:${v.varietyName}`, v);

  const langs = [...new Set([...market.localLanguages, ...market.bridgeLanguages])].filter(
    (l) => l !== 'en',
  );
  const registry = registryEntriesForRegion(market.worldRegion);

  for (const code of langs) {
    if ([...byLang.values()].some((v) => v.languageCode === code)) continue;
    const entry =
      registry.find((e) => e.code === code && countryMatchesRegistry(e, market)) ??
      registry.find((e) => e.code === code);
    const langName = LANGUAGE_BY_CODE.get(code)?.nameEn ?? entry?.name ?? code;
    const cc = market.code.toLowerCase();
    byLang.set(`${code}:default`, {
      languageCode: code,
      languageName: langName,
      varietyName: `${market.nameEn} ${langName}`,
      dialects: entry?.dialects?.length ? entry.dialects : [`${market.nameEn} ${langName}`],
      accents: entry?.accents?.length
        ? entry.accents
        : [`${market.nameEn} ${langName} (spoken)`],
      bcp47: `${code}-${market.code}`,
      accentIdentityId: `${cc}-${code}`,
      primaryLabel: true,
      lifestyleNotes: entry?.lifestyle?.habits?.slice(0, 2).join('; '),
      culturalNotes: entry?.lifestyle?.culturalNotes ?? entry?.notes,
    });
  }

  return [...byLang.values()];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Accent-identity seeds for cultural varieties missing from hand-authored packs. */
export function buildCulturalVarietyAccentIdentitySeeds(
  markets: Array<MarketInput & { culturalVarieties: CulturalVariety[] }>,
  existingIds: Set<string>,
): AccentIdentitySeed[] {
  const seeds: AccentIdentitySeed[] = [];
  const seen = new Set(existingIds);

  for (const market of markets) {
    for (const variety of market.culturalVarieties) {
      const id = variety.accentIdentityId ?? `${market.code.toLowerCase()}-${variety.languageCode}`;
      if (seen.has(id)) continue;
      // Skip generic English — handled by country English accents.
      if (variety.languageCode === 'en') continue;
      seen.add(id);
      seeds.push({
        id,
        nameEn: variety.varietyName,
        languageCode: variety.languageCode,
        country: market.code,
        regionTags: [
          market.nameEn,
          market.region,
          market.worldRegion,
          variety.varietyName,
          ...variety.dialects.slice(0, 2),
        ],
        accentCode: `${variety.languageCode}-${market.code.toLowerCase()}`,
        dialectCode: `${variety.languageCode}-${market.code.toLowerCase()}-${slugify(variety.varietyName)}`,
        identityProfile:
          variety.culturalNotes ??
          `${variety.varietyName} — country-identifying ${variety.languageName} variety for ${market.nameEn}. Dialects: ${variety.dialects.join(', ')}.`,
        pronunciationMarkers: variety.accents.slice(0, 4).map((a) => a.replace(/\s*\(spoken\)\s*/i, '')),
        samplePhrase: `Welcome — this is ${variety.varietyName} for ${market.nameEn}.`,
        bcp47: variety.bcp47,
        culturalIdentity: `${variety.varietyName} · ${market.nameEn} · ${variety.dialects[0] ?? variety.languageName}`,
        speechVariety: slugify(variety.varietyName),
        lifestyleTags: [
          `${market.code.toLowerCase()}_${variety.languageCode}`,
          market.worldRegion,
          slugify(variety.varietyName),
        ],
      });
    }
  }
  return seeds;
}
