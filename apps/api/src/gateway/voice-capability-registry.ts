/**
 * Honest voice capability registry.
 *
 * Distinguishes neural checkpoints, eSpeak-backed demo speech, formant placeholders,
 * and unsupported combinations. Catalog labels must not claim "native neural" when
 * only demo engines are available.
 */

export type SynthEngine = 'neural_kokoro' | 'neural_piper' | 'espeak' | 'formant' | 'unavailable';

export type VerificationStatus =
  | 'native_reviewed'
  | 'espeak_demo'
  | 'formant_placeholder'
  | 'neural_unreviewed'
  | 'unsupported';

export type VoiceCapability = {
  voiceId: string;
  language: string;
  variety: string;
  locale: string;
  /** Best engine available for this voice without remote OWN_TTS weights. */
  localEngine: SynthEngine;
  /** eSpeak voice id when localEngine === 'espeak'. */
  espeakVoice?: string;
  verificationStatus: VerificationStatus;
  /** Safe for customer-facing marketing demos without neural weights. */
  demoSafe: boolean;
  limitations: string;
};

/** Languages with a real eSpeak-NG voice on Debian/Ubuntu espeak-ng-data. */
export const ESPEAK_LANGUAGE_VOICES: Record<string, string> = {
  en: 'en-us',
  'en-us': 'en-us',
  'en-gb': 'en-gb',
  'en-au': 'en-au',
  'en-nz': 'en-nz',
  'en-ca': 'en-us',
  'en-ie': 'en-gb-scotland',
  'en-in': 'en-gb',
  'en-gh': 'en-029',
  'en-ng': 'en-029',
  'en-ke': 'en-gb',
  'en-za': 'en-gb',
  'en-ph': 'en-us',
  'en-sg': 'en-us',
  'en-hk': 'en-gb',
  'en-jm': 'en-029',
  'en-tt': 'en-029',
  'en-bb': 'en-029',
  'en-bs': 'en-029',
  'en-bz': 'en-029',
  'en-gy': 'en-029',
  'en-lr': 'en-029',
  'en-sl': 'en-029',
  'en-gm': 'en-029',
  'en-ug': 'en-gb',
  'en-tz': 'en-gb',
  'en-rw': 'en-gb',
  'en-zw': 'en-gb',
  'en-bw': 'en-gb',
  'en-mw': 'en-gb',
  'en-zm': 'en-gb',
  'en-na': 'en-gb',
  'en-mu': 'en-gb',
  sw: 'sw',
  'sw-ke': 'sw',
  'sw-tz': 'sw',
  am: 'am',
  'am-et': 'am',
  ar: 'ar',
  'ar-eg': 'ar',
  'ar-sa': 'ar',
  'ar-ae': 'ar',
  'ar-ma': 'ar',
  af: 'af',
  'af-za': 'af',
  fr: 'fr-fr',
  'fr-fr': 'fr-fr',
  'fr-be': 'fr-be',
  'fr-ch': 'fr-ch',
  'fr-sn': 'fr-fr',
  'fr-ci': 'fr-fr',
  'fr-ca': 'fr-fr',
  'fr-cd': 'fr-fr',
  'fr-cm': 'fr-fr',
  'fr-ml': 'fr-fr',
  'fr-bj': 'fr-fr',
  'fr-tg': 'fr-fr',
  'fr-ht': 'fr-fr',
  pt: 'pt',
  'pt-pt': 'pt',
  'pt-br': 'pt-br',
  'pt-ao': 'pt',
  'pt-mz': 'pt',
  es: 'es',
  'es-es': 'es',
  'es-mx': 'es-419',
  'es-ar': 'es-419',
  'es-co': 'es-419',
  'es-cl': 'es-419',
  'es-pe': 'es-419',
  'es-419': 'es-419',
  de: 'de',
  'de-de': 'de',
  'de-at': 'de',
  'de-ch': 'de',
  ja: 'ja',
  'ja-jp': 'ja',
  th: 'th',
  'th-th': 'th',
  vi: 'vi',
  'vi-vn': 'vi',
  hi: 'hi',
  'hi-in': 'hi',
  om: 'om',
  'om-et': 'om',
  tn: 'tn',
  'tn-bw': 'tn',
  ko: 'ko',
  'ko-kr': 'ko',
  id: 'id',
  'id-id': 'id',
  ms: 'ms',
  'ms-my': 'ms',
  tr: 'tr',
  'tr-tr': 'tr',
  uk: 'uk',
  'uk-ua': 'uk',
  nl: 'nl',
  'nl-nl': 'nl',
  'nl-be': 'nl',
  pl: 'pl',
  'pl-pl': 'pl',
  ru: 'ru',
  'ru-ru': 'ru',
  sv: 'sv',
  'sv-se': 'sv',
  nb: 'nb',
  no: 'nb',
  'nb-no': 'nb',
  da: 'da',
  'da-dk': 'da',
  fi: 'fi',
  'fi-fi': 'fi',
  el: 'el',
  'el-gr': 'el',
  cs: 'cs',
  'cs-cz': 'cs',
  ro: 'ro',
  'ro-ro': 'ro',
  hu: 'hu',
  'hu-hu': 'hu',
  he: 'he',
  'he-il': 'he',
  fa: 'fa',
  'fa-ir': 'fa',
  ur: 'ur',
  'ur-pk': 'ur',
  bn: 'bn',
  'bn-bd': 'bn',
  'bn-in': 'bn',
  ta: 'ta',
  'ta-in': 'ta',
  te: 'te',
  'te-in': 'te',
  ml: 'ml',
  'ml-in': 'ml',
  gu: 'gu',
  'gu-in': 'gu',
  kn: 'kn',
  'kn-in': 'kn',
  zh: 'cmn',
  'zh-cn': 'cmn',
  'zh-hans': 'cmn',
  cmn: 'cmn',
  'zh-tw': 'cmn',
  'zh-hk': 'yue',
  yue: 'yue',
  ht: 'ht',
  'ht-ht': 'ht',
  ga: 'ga',
  'ga-ie': 'ga',
  cy: 'cy',
  'cy-gb': 'cy',
  mi: 'mi',
  'mi-nz': 'mi',
  it: 'it',
  'it-it': 'it',
  'it-ch': 'it',
};

/**
 * Languages advertised with curated own:* speakers that do NOT have eSpeak voices
 * on stock espeak-ng-data. Without neural weights these must not be sold as native speech.
 */
export const FORMANT_ONLY_WITHOUT_NEURAL = new Set([
  'yo',
  'zu',
  'ak',
  'ig',
  'wo',
  'pcm',
  'lg',
  'ln',
  'rw',
  'xh',
  'ee',
  'ti',
  'sn',
  'ny',
  'ff',
  'bm',
  'so',
]);

export function normalizeLocaleKey(localeOrLang: string): string {
  return localeOrLang.trim().toLowerCase().replace(/_/g, '-');
}

export function resolveEspeakVoice(
  voiceId: string,
  locale?: string,
): { espeakVoice: string; kind: 'espeak' } | { kind: 'formant'; reason: string } {
  const vid = voiceId.toLowerCase();
  const loc = normalizeLocaleKey(locale || '');
  const isFemale =
    vid.includes('female') ||
    /aisha|hanna|ama|chioma|lerato|ava|emma|chloe|mia|ruby|wanjiku|maya|blessing|akosua|ada|nakato|chaltu|uwase|annelie|awa|aissatou|rudo|camille|thandi/.test(
      vid,
    );
  const genderMod = isFemale ? '+f2' : '+m3';

  // Prefer specific BCP-47 tags before bare language codes (en-gb before en → en-us).
  const fromVoice = vid.replace(/^own:/, '').replace(/-(female|male)$/, '');
  const candidates = [
    loc,
    loc.split('-').slice(0, 2).join('-'),
    fromVoice.includes('-') ? fromVoice : '',
    // Bare language last — only if no regional tag matched.
    loc.split('-')[0] ?? '',
    fromVoice.split('-')[0] ?? '',
  ].filter(Boolean);

  for (const key of candidates) {
    const mapped = ESPEAK_LANGUAGE_VOICES[key];
    if (mapped) {
      return { kind: 'espeak', espeakVoice: `${mapped}${genderMod}` };
    }
  }

  // English regional fallbacks from voice id
  if (vid.includes('en-au') || loc === 'en-au') return { kind: 'espeak', espeakVoice: `en-au${genderMod}` };
  if (vid.includes('en-nz') || loc === 'en-nz') return { kind: 'espeak', espeakVoice: `en-nz${genderMod}` };
  if (vid.includes('en-gb') || loc === 'en-gb') return { kind: 'espeak', espeakVoice: `en-gb${genderMod}` };
  if (vid.includes('en-us') || loc === 'en-us') return { kind: 'espeak', espeakVoice: `en-us${genderMod}` };
  if (vid.includes('en-gh') || vid.includes('en-ng') || vid.includes('en-kofi') || loc.startsWith('en-gh') || loc.startsWith('en-ng')) {
    return { kind: 'espeak', espeakVoice: `en-029${genderMod}` };
  }
  if (vid.includes('en-ke') || vid.includes('en-za') || loc.startsWith('en-ke') || loc.startsWith('en-za')) {
    return { kind: 'espeak', espeakVoice: `en-gb${genderMod}` };
  }
  if (vid.includes('en-ph') || loc.startsWith('en-ph') || loc.startsWith('en-ca')) {
    return { kind: 'espeak', espeakVoice: `en-us${genderMod}` };
  }
  if (vid.includes('fr-') || loc.startsWith('fr')) {
    return { kind: 'espeak', espeakVoice: `fr-fr${genderMod}` };
  }

  const primary = (loc.split('-')[0] || fromVoice.split('-')[0] || '').toLowerCase();
  if (FORMANT_ONLY_WITHOUT_NEURAL.has(primary)) {
    return {
      kind: 'formant',
      reason: `No eSpeak voice for ${primary}; neural checkpoint required for native speech`,
    };
  }

  if (primary && ESPEAK_LANGUAGE_VOICES[primary]) {
    return { kind: 'espeak', espeakVoice: `${ESPEAK_LANGUAGE_VOICES[primary]}${genderMod}` };
  }

  return {
    kind: 'formant',
    reason: `No verified eSpeak mapping for voice=${voiceId} locale=${locale ?? ''}`,
  };
}

export function capabilityForVoice(input: {
  voiceId: string;
  locale?: string;
  neuralLive?: boolean;
}): VoiceCapability {
  const locale = normalizeLocaleKey(input.locale || input.voiceId.replace(/^own:/, ''));
  const primary = locale.split('-')[0] || 'und';
  const resolved = resolveEspeakVoice(input.voiceId, locale);

  if (input.neuralLive) {
    return {
      voiceId: input.voiceId,
      language: primary,
      variety: locale,
      locale,
      localEngine: 'neural_kokoro',
      verificationStatus: 'neural_unreviewed',
      demoSafe: true,
      limitations: 'Neural checkpoint listed live on speech engine; native-speaker review still required for approved catalogue.',
    };
  }

  if (resolved.kind === 'espeak') {
    return {
      voiceId: input.voiceId,
      language: primary,
      variety: locale,
      locale,
      localEngine: 'espeak',
      espeakVoice: resolved.espeakVoice,
      verificationStatus: 'espeak_demo',
      demoSafe: true,
      limitations:
        'Demo-quality eSpeak-NG synthesis. Intelligible for demos; not a native-reviewed neural voice.',
    };
  }

  return {
    voiceId: input.voiceId,
    language: primary,
    variety: locale,
    locale,
    localEngine: 'formant',
    verificationStatus: 'formant_placeholder',
    demoSafe: false,
    limitations: resolved.reason,
  };
}

/** Customer-facing marketing demos: only eSpeak-backed or neural-live voices. */
export function isDemoSafeVoice(voiceId: string, locale?: string, neuralLive?: boolean): boolean {
  return capabilityForVoice({ voiceId, locale, neuralLive }).demoSafe;
}
