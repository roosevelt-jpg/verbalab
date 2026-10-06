export type DialectSeed = {
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative?: string;
  region?: string;
  cueTerms: string[];
  notes?: string;
};

/**
 * Curated dialect seeds (VL-131) — priority African + related varieties.
 * Not an exhaustive linguistics catalog.
 */
export const DIALECT_SEEDS: DialectSeed[] = [
  {
    code: 'sw-tz',
    languageCode: 'sw',
    nameEn: 'Tanzanian / coastal Swahili',
    nameNative: 'Kiswahili cha pwani',
    region: 'TZ / coastal East Africa',
    cueTerms: ['sana', 'kwenye', 'labda', 'tafadhali', 'asante sana', 'habari yako'],
    notes: 'Standard coastal-leaning cues; heuristic only.',
  },
  {
    code: 'sw-ke',
    languageCode: 'sw',
    nameEn: 'Kenyan Swahili',
    nameNative: 'Kiswahili cha Kenya',
    region: 'KE',
    cueTerms: ['sasa', 'poa', 'niaje', 'bro', 'uko aje', 'safi'],
    notes: 'Urban Kenyan cues mixed with Sheng-adjacent tokens.',
  },
  {
    code: 'yo-ng',
    languageCode: 'yo',
    nameEn: 'Nigerian Yoruba',
    nameNative: 'Yorùbá',
    region: 'NG',
    cueTerms: ['ẹ káàárọ̀', 'ẹ kú', 'ọmọ', 'jọ̀ọ́', 'béẹ̀ni', 'ràra'],
    notes: 'Common orthographic forms; tone marks optional in matching.',
  },
  {
    code: 'am-et',
    languageCode: 'am',
    nameEn: 'Ethiopian Amharic',
    nameNative: 'አማርኛ',
    region: 'ET',
    cueTerms: ['ሰላም', 'አመሰግናለሁ', 'እባክህ', 'እባክሽ', 'እንደምን'],
    notes: 'Ethiopic-script cues.',
  },
  {
    code: 'ar-eg',
    languageCode: 'ar',
    nameEn: 'Egyptian Arabic',
    nameNative: 'مصري',
    region: 'EG',
    cueTerms: ['ازيك', 'كده', 'مش', 'علشان', 'يعني', 'دلوقتي'],
    notes: 'Colloquial Egyptian cues in Arabic script.',
  },
  {
    code: 'ar-ma',
    languageCode: 'ar',
    nameEn: 'Moroccan Darija',
    nameNative: 'الدارجة',
    region: 'MA',
    cueTerms: ['واش', 'بزاف', 'فين', 'صافي', 'لا باس', 'كيفاش'],
    notes: 'Maghrebi cues; distinct from MSA.',
  },
  {
    code: 'en-ng',
    languageCode: 'en',
    nameEn: 'Nigerian English',
    region: 'NG',
    cueTerms: ['abi', 'na wa', 'how far', 'oya', 'wetin', 'sef'],
    notes: 'Lexical cues only — not accent detection.',
  },
  {
    code: 'en-za',
    languageCode: 'en',
    nameEn: 'South African English',
    region: 'ZA',
    cueTerms: ['lekker', 'braai', 'robot', 'just now', 'sharp sharp', 'howzit'],
    notes: 'Lexical cues only — not accent detection.',
  },
  {
    code: 'ha-ng',
    languageCode: 'ha',
    nameEn: 'Nigerian Hausa',
    nameNative: 'Hausa',
    region: 'NG',
    cueTerms: ['sannu', 'na gode', 'yaya', 'ina kwana', 'lahiya'],
    notes: 'Common greeting/lexical cues.',
  },
  {
    code: 'zu-za',
    languageCode: 'zu',
    nameEn: 'South African Zulu',
    nameNative: 'isiZulu',
    region: 'ZA',
    cueTerms: ['sawubona', 'ngiyabonga', 'unjani', 'yebo', 'cha'],
    notes: 'Common greeting/lexical cues.',
  },
  {
    code: 'af-za',
    languageCode: 'af',
    nameEn: 'South African Afrikaans',
    nameNative: 'Afrikaans',
    region: 'ZA',
    cueTerms: ['dankie', 'asseblief', 'hoe gaan dit', 'baie', 'lekker'],
    notes: 'Common lexical cues.',
  },
];
