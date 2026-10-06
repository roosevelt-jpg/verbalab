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

type ThinLocale = {
  languageCode: string;
  bcp47: string;
  currencyCode: string;
  currencyNotes: string;
  culturalNotes: string;
  honorifics?: HonorificEntry[];
  doNotTranslate?: string[];
};

function thinPack(input: ThinLocale): LocalePackSeed {
  return {
    languageCode: input.languageCode,
    bcp47: input.bcp47,
    dateNotes: 'Prefer Gregorian dates in digital UIs; follow local administrative order when publishing notices.',
    numberNotes: 'Arabic digits in digital UIs unless the orthography traditionally uses another numeral system.',
    currencyCode: input.currencyCode,
    currencyNotes: input.currencyNotes,
    honorifics: input.honorifics ?? [{ form: 'Formal address', usage: 'Prefer respectful forms in public-sector copy' }],
    doNotTranslate: input.doNotTranslate ?? ['Lugemi', 'United Nations', 'AU', 'WHO'],
    culturalNotes: input.culturalNotes,
  };
}

/** Seeded cultural notes — curated summaries, not a CLDR dump. Every registry language gets a BCP-47 locale. */
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
  thinPack({
    languageCode: 'es',
    bcp47: 'es-ES',
    currencyCode: 'EUR',
    currencyNotes: 'Euro in Spain; LATAM markets use local currencies (MXN, COP, ARS, etc.).',
    culturalNotes: 'Usted vs tú/vos varies by region — prefer formal for government and insurance copy.',
  }),
  thinPack({
    languageCode: 'pt',
    bcp47: 'pt-BR',
    currencyCode: 'BRL',
    currencyNotes: 'Brazilian real (R$ / BRL). Portugal uses EUR; Angola AOA; Mozambique MZN.',
    culturalNotes: 'Brazilian Portuguese is the default product locale; African Lusophone markets may need glossary overrides.',
  }),
  thinPack({
    languageCode: 'de',
    bcp47: 'de-DE',
    currencyCode: 'EUR',
    currencyNotes: 'Euro with German formatting (1.234,56 €).',
    culturalNotes: 'Formal Sie is expected in compliance and government German.',
  }),
  thinPack({
    languageCode: 'it',
    bcp47: 'it-IT',
    currencyCode: 'EUR',
    currencyNotes: 'Euro with Italian formatting.',
    culturalNotes: 'Formal Lei for institutional copy.',
  }),
  thinPack({
    languageCode: 'nl',
    bcp47: 'nl-NL',
    currencyCode: 'EUR',
    currencyNotes: 'Euro. South Africa also uses Afrikaans alongside English.',
    culturalNotes: 'Clear, direct register is preferred in Dutch public-sector text.',
  }),
  thinPack({
    languageCode: 'ru',
    bcp47: 'ru-RU',
    currencyCode: 'RUB',
    currencyNotes: 'Russian ruble (₽ / RUB).',
    culturalNotes: 'Cyrillic orthography; keep Latin brand forms when mixed.',
  }),
  thinPack({
    languageCode: 'zh',
    bcp47: 'zh-CN',
    currencyCode: 'CNY',
    currencyNotes: 'Chinese yuan (¥ / CNY).',
    culturalNotes: 'Simplified Chinese default; Traditional requires a separate glossary path.',
  }),
  thinPack({
    languageCode: 'ja',
    bcp47: 'ja-JP',
    currencyCode: 'JPY',
    currencyNotes: 'Japanese yen (¥ / JPY).',
    culturalNotes: 'Keigo level matters for customer care and compliance.',
  }),
  thinPack({
    languageCode: 'ko',
    bcp47: 'ko-KR',
    currencyCode: 'KRW',
    currencyNotes: 'South Korean won (₩ / KRW).',
    culturalNotes: 'Honorific speech levels are required in formal customer care.',
  }),
  thinPack({
    languageCode: 'hi',
    bcp47: 'hi-IN',
    currencyCode: 'INR',
    currencyNotes: 'Indian rupee (₹ / INR).',
    culturalNotes: 'Devanagari script; English code-switching is common in digital UIs.',
  }),
  thinPack({
    languageCode: 'tr',
    bcp47: 'tr-TR',
    currencyCode: 'TRY',
    currencyNotes: 'Turkish lira (₺ / TRY).',
    culturalNotes: 'Formal address for government and insurance copy.',
  }),
  thinPack({
    languageCode: 'id',
    bcp47: 'id-ID',
    currencyCode: 'IDR',
    currencyNotes: 'Indonesian rupiah (Rp / IDR).',
    culturalNotes: 'Bahasa Indonesia is the national standard; regional languages need separate packs.',
  }),
  thinPack({
    languageCode: 'ar',
    bcp47: 'ar-EG',
    currencyCode: 'EGP',
    currencyNotes: 'Egyptian pound default; Maghreb and Gulf use local currencies.',
    culturalNotes: 'RTL Arabic. MSA for formal notices; dialectal varieties need glossary care.',
  }),
  thinPack({
    languageCode: 'ha',
    bcp47: 'ha-NG',
    currencyCode: 'NGN',
    currencyNotes: 'Nigerian naira; Niger uses XOF.',
    culturalNotes: 'Latin orthography default; Ajami (Arabic script) may appear in cultural contexts.',
  }),
  thinPack({
    languageCode: 'zu',
    bcp47: 'zu-ZA',
    currencyCode: 'ZAR',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes: 'Respectful address and clan names matter in formal isiZulu.',
  }),
  thinPack({
    languageCode: 'ig',
    bcp47: 'ig-NG',
    currencyCode: 'NGN',
    currencyNotes: 'Nigerian naira (₦ / NGN).',
    culturalNotes: 'Tone and respectful address matter in Igbo community notices.',
  }),
  thinPack({
    languageCode: 'so',
    bcp47: 'so-SO',
    currencyCode: 'SOS',
    currencyNotes: 'Somali shilling; diaspora often uses USD/KES.',
    culturalNotes: 'Latin orthography; keep clan and place names intact.',
  }),
  thinPack({
    languageCode: 'rw',
    bcp47: 'rw-RW',
    currencyCode: 'RWF',
    currencyNotes: 'Rwandan franc (RF / RWF).',
    culturalNotes: 'Kinyarwanda public notices often pair with English or French.',
  }),
  thinPack({
    languageCode: 'sn',
    bcp47: 'sn-ZW',
    currencyCode: 'USD',
    currencyNotes: 'Zimbabwe commonly settles in USD; local currency may apply.',
    culturalNotes: 'chiShona formal register for government notices.',
  }),
  thinPack({
    languageCode: 'xh',
    bcp47: 'xh-ZA',
    currencyCode: 'ZAR',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes: 'Click consonants and respectful address in isiXhosa.',
  }),
  thinPack({
    languageCode: 'nso',
    bcp47: 'nso-ZA',
    currencyCode: 'ZAR',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes: 'Sesotho sa Leboa (Northern Sotho) for Limpopo-facing services.',
  }),
  thinPack({
    languageCode: 'tn',
    bcp47: 'tn-BW',
    currencyCode: 'BWP',
    currencyNotes: 'Botswana pula (P / BWP); South Africa also uses Setswana with ZAR.',
    culturalNotes: 'Setswana formal register for citizen services.',
  }),
  thinPack({
    languageCode: 'st',
    bcp47: 'st-LS',
    currencyCode: 'LSL',
    currencyNotes: 'Lesotho loti (L / LSL); South Africa uses ZAR for Sesotho.',
    culturalNotes: 'Sesotho public notices often bilingual with English.',
  }),
  thinPack({
    languageCode: 'af',
    bcp47: 'af-ZA',
    currencyCode: 'ZAR',
    currencyNotes: 'South African rand (R / ZAR).',
    culturalNotes: 'Afrikaans formal register for government and insurance in SA/Namibia.',
  }),
  thinPack({
    languageCode: 'om',
    bcp47: 'om-ET',
    currencyCode: 'ETB',
    currencyNotes: 'Ethiopian birr (Br / ETB).',
    culturalNotes: 'Afaan Oromoo Latin orthography; keep toponyms intact.',
  }),
  thinPack({
    languageCode: 'ti',
    bcp47: 'ti-ET',
    currencyCode: 'ETB',
    currencyNotes: 'Ethiopian birr; Eritrea uses ERN for Tigrinya.',
    culturalNotes: 'Geʽez script; bilingual layouts with Latin brands are common.',
  }),
  thinPack({
    languageCode: 'wo',
    bcp47: 'wo-SN',
    currencyCode: 'XOF',
    currencyNotes: 'West African CFA franc (CFA / XOF).',
    culturalNotes: 'Wolof often pairs with French in Senegalese public services.',
  }),
  thinPack({
    languageCode: 'lg',
    bcp47: 'lg-UG',
    currencyCode: 'UGX',
    currencyNotes: 'Ugandan shilling (USh / UGX).',
    culturalNotes: 'Luganda is widely used in central Uganda citizen services.',
  }),
  thinPack({
    languageCode: 'ee',
    bcp47: 'ee-GH',
    currencyCode: 'GHS',
    currencyNotes: 'Ghanaian cedi (GH₵ / GHS); Togo uses XOF for Ewe.',
    culturalNotes: 'Eʋegbe for southeastern Ghana / southern Togo audiences.',
  }),
  thinPack({
    languageCode: 'bm',
    bcp47: 'bm-ML',
    currencyCode: 'XOF',
    currencyNotes: 'West African CFA franc (CFA / XOF).',
    culturalNotes: 'Bamanankan is a lingua franca across Mali and neighboring markets.',
  }),
  thinPack({
    languageCode: 'ln',
    bcp47: 'ln-CD',
    currencyCode: 'CDF',
    currencyNotes: 'Congolese franc (FC / CDF); Congo-Brazzaville uses XAF.',
    culturalNotes: 'Lingála spans DRC/ROC urban media and public messaging.',
  }),
  thinPack({
    languageCode: 'ny',
    bcp47: 'ny-MW',
    currencyCode: 'MWK',
    currencyNotes: 'Malawian kwacha (MK / MWK); Zambia uses ZMW for Chichewa/Nyanja.',
    culturalNotes: 'Chichewa/Nyanja citizen-service copy across Malawi and parts of Zambia.',
  }),
  thinPack({
    languageCode: 'mg',
    bcp47: 'mg-MG',
    currencyCode: 'MGA',
    currencyNotes: 'Malagasy ariary (Ar / MGA).',
    culturalNotes: 'Malagasy often pairs with French in official bilingual layouts.',
  }),
  thinPack({
    languageCode: 'ff',
    bcp47: 'ff-SN',
    currencyCode: 'XOF',
    currencyNotes: 'West African CFA franc across Sahelian markets.',
    culturalNotes: 'Fulfulde varieties span West Africa — prefer glossary for regional orthography.',
  }),
  thinPack({
    languageCode: 'pcm',
    bcp47: 'pcm-NG',
    currencyCode: 'NGN',
    currencyNotes: 'Nigerian naira (₦ / NGN).',
    culturalNotes: 'Naijá (Nigerian Pidgin) for informal customer care; keep formal legal text in English or major national languages.',
  }),
];
