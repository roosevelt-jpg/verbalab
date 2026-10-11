/**
 * Canonical Ghana language & accent stack.
 *
 * Every Ghanaian language Lugemi ships for translation, accents, speech routing,
 * country packs, and voice-data collection is listed here. Product UIs and seeds
 * should align to this list — do not leave major Ghana languages as catalog orphans.
 */

export type GhanaLanguageDef = {
  /** ISO 639-3 (or ISO 639-1 when that is the registry primary). */
  code: string;
  nameEn: string;
  nameNative: string;
  /** Primary BCP-47 tag for Ghana. */
  bcp47: string;
  family: 'akan' | 'kwa' | 'gur' | 'mande' | 'chadic' | 'germanic' | 'creole';
  role: 'official_bridge' | 'major_school' | 'regional' | 'community';
  varieties: string[];
};

/** Full Ghana stack — English + government/school languages + major regional languages. */
export const GHANA_LANGUAGE_STACK: GhanaLanguageDef[] = [
  {
    code: 'en',
    nameEn: 'Ghanaian English',
    nameNative: 'English',
    bcp47: 'en-GH',
    family: 'germanic',
    role: 'official_bridge',
    varieties: ['Ghanaian English', 'Ghanaian Pidgin'],
  },
  {
    code: 'ak',
    nameEn: 'Akan (Twi / Fante)',
    nameNative: 'Akan',
    bcp47: 'ak-GH',
    family: 'akan',
    role: 'major_school',
    varieties: ['Asante Twi', 'Akuapem Twi', 'Fante'],
  },
  {
    code: 'ee',
    nameEn: 'Ewe',
    nameNative: 'Eʋegbe',
    bcp47: 'ee-GH',
    family: 'kwa',
    role: 'major_school',
    varieties: ['Anlo', 'Tongu'],
  },
  {
    code: 'gaa',
    nameEn: 'Ga',
    nameNative: 'Gã',
    bcp47: 'gaa-GH',
    family: 'kwa',
    role: 'major_school',
    varieties: ['Ga (Accra)', 'Ga Mashie'],
  },
  {
    code: 'ada',
    nameEn: 'Dangme',
    nameNative: 'Dangme',
    bcp47: 'ada-GH',
    family: 'kwa',
    role: 'major_school',
    varieties: ['Ada', 'Krobo', 'Shai'],
  },
  {
    code: 'dag',
    nameEn: 'Dagbani',
    nameNative: 'Dagbanli',
    bcp47: 'dag-GH',
    family: 'gur',
    role: 'major_school',
    varieties: ['Dagbani (Tamale)', 'Yendi'],
  },
  {
    code: 'dga',
    nameEn: 'Dagaare',
    nameNative: 'Dagaare',
    bcp47: 'dga-GH',
    family: 'gur',
    role: 'major_school',
    varieties: ['Southern Dagaare', 'Northern Dagaare'],
  },
  {
    code: 'gjn',
    nameEn: 'Gonja',
    nameNative: 'Ngbanyito',
    bcp47: 'gjn-GH',
    family: 'gur',
    role: 'regional',
    varieties: ['Gonja (Damongo)', 'Bole'],
  },
  {
    code: 'xsm',
    nameEn: 'Kasem',
    nameNative: 'Kasem',
    bcp47: 'xsm-GH',
    family: 'gur',
    role: 'regional',
    varieties: ['Kasem (Navrongo)'],
  },
  {
    code: 'gur',
    nameEn: 'Farefare',
    nameNative: 'Gurene',
    bcp47: 'gur-GH',
    family: 'gur',
    role: 'regional',
    varieties: ['Gurene', 'Nankani'],
  },
  {
    code: 'nzi',
    nameEn: 'Nzema',
    nameNative: 'Nzema',
    bcp47: 'nzi-GH',
    family: 'akan',
    role: 'regional',
    varieties: ['Nzema (Axim)', 'Jomoro'],
  },
  {
    code: 'maw',
    nameEn: 'Mampruli',
    nameNative: 'Mampruli',
    bcp47: 'maw-GH',
    family: 'gur',
    role: 'regional',
    varieties: ['Mampruli (Nalerigu)'],
  },
  {
    code: 'bwu',
    nameEn: 'Buli',
    nameNative: 'Buli',
    bcp47: 'bwu-GH',
    family: 'gur',
    role: 'community',
    varieties: ['Buli (Sandema)'],
  },
  {
    code: 'xon',
    nameEn: 'Konkomba',
    nameNative: 'Likpakpaanl',
    bcp47: 'xon-GH',
    family: 'gur',
    role: 'community',
    varieties: ['Konkomba (Saboba)'],
  },
  {
    code: 'sil',
    nameEn: 'Sisaala',
    nameNative: 'Sisaala',
    bcp47: 'sil-GH',
    family: 'gur',
    role: 'community',
    varieties: ['Sisaala (Tumu)'],
  },
  {
    code: 'wlx',
    nameEn: 'Wali',
    nameNative: 'Wali',
    bcp47: 'wlx-GH',
    family: 'gur',
    role: 'community',
    varieties: ['Wali (Wa)'],
  },
  {
    code: 'ha',
    nameEn: 'Hausa (Ghana)',
    nameNative: 'Hausa',
    bcp47: 'ha-GH',
    family: 'chadic',
    role: 'community',
    varieties: ['Ghana Hausa (zongo)', 'Tamale Hausa'],
  },
];

/** Language codes that must appear in the GH country pack primary list. */
export const GHANA_PRIMARY_LANGUAGE_CODES = GHANA_LANGUAGE_STACK.map((l) => l.code);

/** BCP-47 tags for GH country pack. */
export const GHANA_BCP47_TAGS = GHANA_LANGUAGE_STACK.map((l) =>
  l.code === 'ak' ? 'ak-GH-twi' : l.bcp47,
);

/** Dialect codes collected for Ghana voice-data / accent routing. */
export const GHANA_VOICE_DATA_DIALECTS = [
  { code: 'en-gh', languageCode: 'en', name: 'Ghanaian English', country: 'GH' },
  { code: 'en-gh-pidgin', languageCode: 'en', name: 'Ghanaian Pidgin', country: 'GH' },
  { code: 'ak-gh-asante', languageCode: 'ak', name: 'Asante Twi', country: 'GH' },
  { code: 'ak-gh-akuapem', languageCode: 'ak', name: 'Akuapem Twi', country: 'GH' },
  { code: 'ak-gh-fante', languageCode: 'ak', name: 'Fante', country: 'GH' },
  { code: 'ee-gh-anlo', languageCode: 'ee', name: 'Anlo Ewe', country: 'GH' },
  { code: 'ee-gh-tongu', languageCode: 'ee', name: 'Tongu Ewe', country: 'GH' },
  { code: 'gaa-gh', languageCode: 'gaa', name: 'Ga', country: 'GH' },
  { code: 'ada-gh', languageCode: 'ada', name: 'Dangme', country: 'GH' },
  { code: 'dag-gh', languageCode: 'dag', name: 'Dagbani', country: 'GH' },
  { code: 'dga-gh', languageCode: 'dga', name: 'Dagaare', country: 'GH' },
  { code: 'gjn-gh', languageCode: 'gjn', name: 'Gonja', country: 'GH' },
  { code: 'xsm-gh', languageCode: 'xsm', name: 'Kasem', country: 'GH' },
  { code: 'gur-gh', languageCode: 'gur', name: 'Farefare (Gurene)', country: 'GH' },
  { code: 'nzi-gh', languageCode: 'nzi', name: 'Nzema', country: 'GH' },
  { code: 'maw-gh', languageCode: 'maw', name: 'Mampruli', country: 'GH' },
  { code: 'bwu-gh', languageCode: 'bwu', name: 'Buli', country: 'GH' },
  { code: 'xon-gh', languageCode: 'xon', name: 'Konkomba', country: 'GH' },
  { code: 'sil-gh', languageCode: 'sil', name: 'Sisaala', country: 'GH' },
  { code: 'wlx-gh', languageCode: 'wlx', name: 'Wali', country: 'GH' },
  { code: 'ha-gh', languageCode: 'ha', name: 'Hausa (Ghana)', country: 'GH' },
] as const;

export const GHANA_RELATED_DIALECT_CODES = GHANA_VOICE_DATA_DIALECTS.map((d) => d.code);

export const GHANA_RELATED_ACCENT_CODES = [
  'en-gh',
  'ak-gh',
  'ak-gh-fante',
  'ee-gh',
  'gaa-gh',
  'ada-gh',
  'dag-gh',
  'dga-gh',
  'gjn-gh',
  'xsm-gh',
  'gur-gh',
  'nzi-gh',
  'maw-gh',
  'bwu-gh',
  'xon-gh',
  'sil-gh',
  'wlx-gh',
  'ha-gh',
] as const;
