export type WritingSystemSeed = {
  code: string;
  nameEn: string;
  kind: 'alphabet' | 'abjad' | 'abugida' | 'syllabary' | 'logographic' | 'other';
  rtl?: boolean;
  sampleChars?: string;
  notes?: string;
};

/** ISO 15924 writing systems / scripts / alphabets used by the registry. */
export const WRITING_SYSTEM_SEEDS: WritingSystemSeed[] = [
  {
    code: 'Latn',
    nameEn: 'Latin',
    kind: 'alphabet',
    sampleChars: 'AaBbCc',
    notes: 'Default alphabet for most vendor and African Latin orthographies.',
  },
  {
    code: 'Arab',
    nameEn: 'Arabic',
    kind: 'abjad',
    rtl: true,
    sampleChars: 'ابجد',
  },
  {
    code: 'Ethi',
    nameEn: 'Ethiopic (Geʻez)',
    kind: 'abugida',
    sampleChars: 'አማ',
    notes: 'Used by Amharic in the strategic African set.',
  },
  {
    code: 'Cyrl',
    nameEn: 'Cyrillic',
    kind: 'alphabet',
    sampleChars: 'АаБб',
  },
  {
    code: 'Deva',
    nameEn: 'Devanagari',
    kind: 'abugida',
    sampleChars: 'अआइ',
  },
  {
    code: 'Hans',
    nameEn: 'Han (Simplified)',
    kind: 'logographic',
    sampleChars: '汉字',
  },
  {
    code: 'Hant',
    nameEn: 'Han (Traditional)',
    kind: 'logographic',
    sampleChars: '漢字',
  },
  {
    code: 'Jpan',
    nameEn: 'Japanese (alias)',
    kind: 'other',
    sampleChars: 'あア漢',
    notes: 'Alias covering Hiragana/Katakana/Kanji mix for registry linkage.',
  },
  {
    code: 'Kore',
    nameEn: 'Korean (Hangul)',
    kind: 'alphabet',
    sampleChars: '한글',
  },
  {
    code: 'Grek',
    nameEn: 'Greek',
    kind: 'alphabet',
    sampleChars: 'ΑαΒβ',
  },
  {
    code: 'Hebr',
    nameEn: 'Hebrew',
    kind: 'abjad',
    rtl: true,
    sampleChars: 'אבג',
  },
  { code: 'Tfng', nameEn: 'Tifinagh', kind: 'alphabet', sampleChars: 'ⵜⴰⵎ', notes: 'Berber / Tamazight orthographies.' },
  { code: 'Nkoo', nameEn: 'N’Ko', kind: 'alphabet', rtl: true, sampleChars: 'ߒߞߏ', notes: 'Manding N’Ko script.' },
  { code: 'Vaii', nameEn: 'Vai', kind: 'syllabary', sampleChars: 'ꕙꔤ', notes: 'Vai syllabary (Liberia).' },
  { code: 'Copt', nameEn: 'Coptic', kind: 'alphabet', sampleChars: 'Ⲁⲃⲅ', notes: 'Liturgical Coptic.' },
  { code: 'Osma', nameEn: 'Osmanya', kind: 'alphabet', sampleChars: '𐒀𐒁𐒂', notes: 'Somali Osmanya script (historical / cultural).' },
  { code: 'Thai', nameEn: 'Thai', kind: 'abugida', sampleChars: 'กขค', notes: 'Thai script.' },
  { code: 'Laoo', nameEn: 'Lao', kind: 'abugida', sampleChars: 'ກຂຄ', notes: 'Lao script.' },
  { code: 'Khmr', nameEn: 'Khmer', kind: 'abugida', sampleChars: 'កខគ', notes: 'Khmer script.' },
  { code: 'Mymr', nameEn: 'Myanmar (Burmese)', kind: 'abugida', sampleChars: 'ကခဂ', notes: 'Myanmar / Burmese script.' },
  { code: 'Cans', nameEn: 'Canadian Aboriginal Syllabics', kind: 'syllabary', sampleChars: 'ᐊᐃᐅ', notes: 'Inuktitut and related syllabics.' },
  { code: 'Cher', nameEn: 'Cherokee', kind: 'syllabary', sampleChars: 'ᎠᎡᎢ', notes: 'Cherokee syllabary.' },
];
