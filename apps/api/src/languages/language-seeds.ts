export type LanguageSeed = {
  code: string;
  nameEn: string;
  nameNative?: string;
  script?: string;
  familyCode?: string;
  rtl?: boolean;
  tier: 'vendor' | 'strategic_african';
};

/** ISO 639-1 / BCP-47 subset + curated African set (VL-020 / VL-139). */
export const LANGUAGE_SEEDS: LanguageSeed[] = [
  { code: 'en', nameEn: 'English', nameNative: 'English', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'fr', nameEn: 'French', nameNative: 'Français', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'es', nameEn: 'Spanish', nameNative: 'Español', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'pt', nameEn: 'Portuguese', nameNative: 'Português', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'de', nameEn: 'German', nameNative: 'Deutsch', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'it', nameEn: 'Italian', nameNative: 'Italiano', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'nl', nameEn: 'Dutch', nameNative: 'Nederlands', script: 'Latn', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'ru', nameEn: 'Russian', nameNative: 'Русский', script: 'Cyrl', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'zh', nameEn: 'Chinese (Simplified)', nameNative: '中文', script: 'Hans', familyCode: 'sino_tibetan', tier: 'vendor' },
  { code: 'ja', nameEn: 'Japanese', nameNative: '日本語', script: 'Jpan', familyCode: 'japonic', tier: 'vendor' },
  { code: 'ko', nameEn: 'Korean', nameNative: '한국어', script: 'Kore', familyCode: 'koreanic', tier: 'vendor' },
  { code: 'hi', nameEn: 'Hindi', nameNative: 'हिन्दी', script: 'Deva', familyCode: 'indo_european', tier: 'vendor' },
  { code: 'tr', nameEn: 'Turkish', nameNative: 'Türkçe', script: 'Latn', familyCode: 'turkic', tier: 'vendor' },
  { code: 'id', nameEn: 'Indonesian', nameNative: 'Bahasa Indonesia', script: 'Latn', familyCode: 'austronesian', tier: 'vendor' },
  { code: 'ar', nameEn: 'Arabic', nameNative: 'العربية', script: 'Arab', familyCode: 'afro_asiatic', rtl: true, tier: 'strategic_african' },
  { code: 'sw', nameEn: 'Swahili', nameNative: 'Kiswahili', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'yo', nameEn: 'Yoruba', nameNative: 'Yorùbá', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'ha', nameEn: 'Hausa', nameNative: 'Hausa', script: 'Latn', familyCode: 'afro_asiatic', tier: 'strategic_african' },
  { code: 'am', nameEn: 'Amharic', nameNative: 'አማርኛ', script: 'Ethi', familyCode: 'afro_asiatic', tier: 'strategic_african' },
  { code: 'zu', nameEn: 'Zulu', nameNative: 'isiZulu', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'ig', nameEn: 'Igbo', nameNative: 'Igbo', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'so', nameEn: 'Somali', nameNative: 'Soomaali', script: 'Latn', familyCode: 'afro_asiatic', tier: 'strategic_african' },
  { code: 'rw', nameEn: 'Kinyarwanda', nameNative: 'Ikinyarwanda', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'sn', nameEn: 'Shona', nameNative: 'chiShona', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'xh', nameEn: 'Xhosa', nameNative: 'isiXhosa', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'nso', nameEn: 'Northern Sotho', nameNative: 'Sesotho sa Leboa', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'tn', nameEn: 'Tswana', nameNative: 'Setswana', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'st', nameEn: 'Southern Sotho', nameNative: 'Sesotho', script: 'Latn', familyCode: 'niger_congo', tier: 'strategic_african' },
  { code: 'af', nameEn: 'Afrikaans', nameNative: 'Afrikaans', script: 'Latn', familyCode: 'indo_european', tier: 'strategic_african' },
];
