export type HonorificEntry = {
  form: string;
  usage: string;
  notes?: string;
};

export type LocalePackSeed = {
  languageCode: string;
  bcp47: string;
  dateNotes: string;
  numberNotes: string;
  currencyCode: string;
  currencyNotes: string;
  honorifics: HonorificEntry[];
  doNotTranslate: string[];
  culturalNotes: string;
};

/** Seeded cultural notes — curated summaries, not a CLDR dump. */
export const LOCALE_PACK_SEEDS: LocalePackSeed[] = [
  {
    languageCode: 'en',
    bcp47: 'en-US',
    dateNotes: 'Common order MDY (US) or DMY (UK). ISO 8601 preferred in APIs.',
    numberNotes: 'Period as decimal separator; comma as thousands separator (locale-dependent).',
    currencyCode: 'USD',
    currencyNotes: 'Symbol before amount ($10). ISO code USD in formal text.',
    honorifics: [
      { form: 'Mr./Ms./Mx.', usage: 'Titles before surname', notes: 'Prefer gender-neutral Mx. when unknown' },
      { form: 'Dr.', usage: 'Medical/academic title' },
    ],
    doNotTranslate: ['United Nations', 'WHO', 'Lugemi'],
    culturalNotes: 'Baseline vendor language. Keep brand and org names unchanged.',
  },
  {
    languageCode: 'fr',
    bcp47: 'fr-FR',
    dateNotes: 'DMY with day first (e.g. 7 septembre 2026). Space or thin space before unit symbols.',
    numberNotes: 'Comma as decimal separator; space/narrow no-break as thousands separator.',
    currencyCode: 'EUR',
    currencyNotes: 'Symbol after amount with space (10 €) in France.',
    honorifics: [
      { form: 'M.', usage: 'Monsieur' },
      { form: 'Mme', usage: 'Madame' },
      { form: 'Dr', usage: 'Docteur' },
    ],
    doNotTranslate: ['ONU', 'OMS', 'Lugemi'],
    culturalNotes: 'Formal vous vs informal tu matters in government copy.',
  },
  {
    languageCode: 'sw',
    bcp47: 'sw-TZ',
    dateNotes: 'Typically DMY. Week often starts Monday in formal Tanzanian contexts.',
    numberNotes: 'Arabic digits; period or comma may appear — prefer consistent locale formatting.',
    currencyCode: 'TZS',
    currencyNotes: 'Tanzanian shilling (TSh / TZS). Kenya uses KES when targeting KE audiences.',
    honorifics: [
      { form: 'Bwana', usage: 'Mr. / sir' },
      { form: 'Bi', usage: 'Ms. / Madam' },
      { form: 'Daktari', usage: 'Doctor' },
      { form: 'Mheshimiwa', usage: 'Honorable (officials)' },
    ],
    doNotTranslate: ['Nairobi', 'Dar es Salaam', 'Dodoma', 'EAC', 'SADC', 'WHO'],
    culturalNotes: 'Respectful address (Mheshimiwa) is expected in public-sector Swahili.',
  },
  {
    languageCode: 'yo',
    bcp47: 'yo-NG',
    dateNotes: 'DMY common in Nigerian administrative text. Tone marks matter in formal Yoruba orthography.',
    numberNotes: 'Arabic digits. Prefer retaining tone-marked spellings from glossary where provided.',
    currencyCode: 'NGN',
    currencyNotes: 'Nigerian naira (₦ / NGN).',
    honorifics: [
      { form: 'Ẹ̀yin', usage: 'Respectful you (plural/honorific)' },
      { form: 'Bàbá', usage: 'Father / elder male address' },
      { form: 'Ìyá', usage: 'Mother / elder female address' },
      { form: 'Dókítà', usage: 'Doctor' },
    ],
    doNotTranslate: ['Lagos', 'Ibadan', 'Abuja', 'Nollywood', 'ECOWAS'],
    culturalNotes: 'Honorific pronouns and tone marks carry social meaning; do not flatten casually.',
  },
  {
    languageCode: 'am',
    bcp47: 'am-ET',
    dateNotes: 'Ethiopian calendar (EC) is used domestically alongside Gregorian in formal bilingual docs. Note both when dates matter.',
    numberNotes: 'Ethiopic numerals exist culturally; Arabic digits dominate digital UIs.',
    currencyCode: 'ETB',
    currencyNotes: 'Ethiopian birr (Br / ETB).',
    honorifics: [
      { form: 'አቶ', usage: 'Ato (Mr.)' },
      { form: 'ወይዘሮ', usage: 'Weizero (Mrs.)' },
      { form: 'ወይዘሪት', usage: 'Weizerit (Miss)' },
      { form: 'ዶ/ር', usage: 'Doctor' },
    ],
    doNotTranslate: ['Addis Ababa', 'አዲስ አበባ', 'AU', 'UNECA', 'Ethio Telecom'],
    culturalNotes: 'Geʽez script; keep proper names and Latin brand forms intact when mixed scripts appear.',
  },
  {
    languageCode: 'ak',
    bcp47: 'ak-GH',
    dateNotes: 'DMY common in Ghanaian administrative text. Gregorian calendar in digital UIs.',
    numberNotes: 'Arabic digits. Prefer glossary spellings for Asante vs Akuapem Twi where tone/orthography differs.',
    currencyCode: 'GHS',
    currencyNotes: 'Ghanaian cedi (GH₵ / GHS).',
    honorifics: [
      { form: 'Papa', usage: 'Respectful male elder address' },
      { form: 'Maame', usage: 'Respectful female elder address' },
      { form: 'Nana', usage: 'Chief / elder honorific' },
      { form: 'Dokota', usage: 'Doctor' },
    ],
    doNotTranslate: ['Accra', 'Kumasi', 'Ghana', 'ECOWAS', 'AU', 'Bank of Ghana', 'Lugemi'],
    culturalNotes:
      'Default Lugemi Translation Panel target (English → Twi / Akan). Asante Twi is the common spoken variety; keep chieftaincy titles and toponyms intact.',
  },
];
