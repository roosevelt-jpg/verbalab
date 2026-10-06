export type AccentSeed = {
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative?: string;
  region?: string;
  relatedDialectCode?: string;
  cueTerms: string[];
  notes?: string;
};

/**
 * Curated spoken accent profiles — African-priority.
 * Labels are profiles inferred from transcript cues after STT or from text.
 * Not an acoustic phonetics / unlimited accent catalog.
 */
export const ACCENT_SEEDS: AccentSeed[] = [
  {
    code: 'en-ng',
    languageCode: 'en',
    nameEn: 'Nigerian English (spoken)',
    region: 'NG',
    relatedDialectCode: 'en-ng',
    cueTerms: ['abi', 'na wa', 'how far', 'oya', 'wetin', 'sef', 'abeg'],
    notes: 'Lexical proxies for spoken Nigerian English — not acoustic ID.',
  },
  {
    code: 'en-za',
    languageCode: 'en',
    nameEn: 'South African English (spoken)',
    region: 'ZA',
    relatedDialectCode: 'en-za',
    cueTerms: ['lekker', 'braai', 'robot', 'just now', 'sharp sharp', 'howzit'],
    notes: 'Lexical proxies — not acoustic ID.',
  },
  {
    code: 'en-ke',
    languageCode: 'en',
    nameEn: 'Kenyan English (spoken)',
    region: 'KE',
    cueTerms: ['sasa', 'pole', 'hakuna', 'niaje', 'kwani', 'mzungu'],
    notes: 'Kenyan English / Sheng-adjacent spoken cues.',
  },
  {
    code: 'en-gh',
    languageCode: 'en',
    nameEn: 'Ghanaian English (spoken)',
    region: 'GH',
    cueTerms: ['chale', 'paa', 'charley', 'small small', 'please', 'eh'],
    notes: 'Common Ghanaian English lexical cues.',
  },
  {
    code: 'fr-sn',
    languageCode: 'fr',
    nameEn: 'Senegalese French (spoken)',
    region: 'SN',
    cueTerms: ['waaw', 'déédéét', 'amul', 'jërëjëf', 'nanga def'],
    notes: 'Wolof-influenced French spoken cues mixed with French.',
  },
  {
    code: 'fr-ci',
    languageCode: 'fr',
    nameEn: 'Ivorian French (spoken)',
    region: 'CI',
    cueTerms: ['yako', 'on est ensemble', 'il y a moyen', 'en tout cas', 'même'],
    notes: 'Nouchi / Ivorian spoken French proxies.',
  },
  {
    code: 'ar-eg',
    languageCode: 'ar',
    nameEn: 'Egyptian Arabic (spoken)',
    region: 'EG',
    relatedDialectCode: 'ar-eg',
    cueTerms: ['ازيك', 'كده', 'مش', 'علشان', 'يعني', 'دلوقتي'],
    notes: 'Colloquial Egyptian spoken cues.',
  },
  {
    code: 'sw-ke',
    languageCode: 'sw',
    nameEn: 'Kenyan Swahili (spoken)',
    region: 'KE',
    relatedDialectCode: 'sw-ke',
    cueTerms: ['sasa', 'poa', 'niaje', 'bro', 'uko aje', 'safi'],
    notes: 'Spoken Kenyan Swahili / Sheng-adjacent cues.',
  },
  {
    code: 'ha-ng',
    languageCode: 'ha',
    nameEn: 'Nigerian Hausa (spoken)',
    region: 'NG',
    relatedDialectCode: 'ha-ng',
    cueTerms: ['sannu', 'na gode', 'yaya', 'ina kwana', 'lahiya'],
    notes: 'Spoken greeting/lexical cues.',
  },
  {
    code: 'zu-za',
    languageCode: 'zu',
    nameEn: 'South African Zulu (spoken)',
    region: 'ZA',
    relatedDialectCode: 'zu-za',
    cueTerms: ['sawubona', 'ngiyabonga', 'unjani', 'yebo', 'cha'],
    notes: 'Spoken greeting/lexical cues.',
  },
{ code: 'ak-gh', languageCode: 'ak', nameEn: 'Ghanaian Twi (spoken)', region: 'GH', relatedDialectCode: 'ak-gh-asante', cueTerms: ['medaase', 'akwaaba', 'ɛte sɛn'], notes: 'Asante Twi spoken cues — default Lugemi demo accent.' },
  { code: 'ig-ng', languageCode: 'ig', nameEn: 'Nigerian Igbo (spoken)', region: 'NG', cueTerms: ['ndewo', 'daalụ', 'kedu', 'biko'], notes: 'Spoken Igbo greeting cues.' },
  { code: 'wo-sn', languageCode: 'wo', nameEn: 'Senegalese Wolof (spoken)', region: 'SN', cueTerms: ['nanga def', 'jërëjëf', 'waaw'], notes: 'Spoken Wolof cues.' },
  { code: 'pcm-ng', languageCode: 'pcm', nameEn: 'Nigerian Pidgin (spoken)', region: 'NG', cueTerms: ['how far', 'abeg', 'wahala'], notes: 'Naijá spoken cues.' },
  { code: 'xh-za', languageCode: 'xh', nameEn: 'South African Xhosa (spoken)', region: 'ZA', cueTerms: ['molo', 'enkosi', 'unjani'], notes: 'Spoken isiXhosa cues.' }
];
