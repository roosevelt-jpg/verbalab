/**
 * Resolve a customer-facing demo speech request to a verified intelligible path.
 *
 * Identity packs for languages without eSpeak/neural weights (Yoruba, Akan, Zulu, …)
 * remap to the cultural English/French variety of the same country so Play never
 * returns capability_unavailable or formant noise. Remaps are disclosed via headers.
 */

import {
  FORMANT_ONLY_WITHOUT_NEURAL,
  isDemoSafeVoice,
  normalizeLocaleKey,
} from '../gateway/voice-capability-registry';
import { isOwnTtsVoice, resolveOwnTtsVoice } from '../gateway/own-tts.adapter';
import { voiceSpeaksNatively } from '../gateway/native-voice';

export type DemoSpeechTarget = {
  voice: string;
  language: string;
  text: string;
  remapped: boolean;
  requestedVoice: string | null;
  requestedLanguage: string;
  note: string | null;
};

/** Cultural demo remaps for formant-only / unsupported L1 voices → demo-safe Echo voices. */
const VOICE_REMAP: Record<string, { voice: string; language: string; sample: string; note: string }> =
  {
    'own:ak-gh-female': {
      voice: 'own:en-gh-female',
      language: 'en-GH',
      sample: 'Akwaaba — welcome. Medaase. This is Ghanaian English from Accra.',
      note: 'Akan/Twi neural weights not live; demo uses Ghanaian English (en-029).',
    },
    'own:ee-gh-female': {
      voice: 'own:en-gh-female',
      language: 'en-GH',
      sample: 'Woezɔ — welcome. This is Ghanaian English from the Volta region.',
      note: 'Ewe neural weights not live; demo uses Ghanaian English.',
    },
    'own:gaa-pack': {
      voice: 'own:en-gh-female',
      language: 'en-GH',
      sample: 'Oshiee — welcome to Accra. This is Ghanaian English.',
      note: 'Ga neural weights not live; demo uses Ghanaian English.',
    },
    'own:ada-pack': {
      voice: 'own:en-gh-female',
      language: 'en-GH',
      sample: 'Manyee — welcome. This is Ghanaian English from Ada.',
      note: 'Dangme neural weights not live; demo uses Ghanaian English.',
    },
    'own:dag-pack': {
      voice: 'own:en-gh-male',
      language: 'en-GH',
      sample: 'Dasiba — good morning. This is Ghanaian English from Tamale.',
      note: 'Dagbani neural weights not live; demo uses Ghanaian English.',
    },
    'own:yo-ng-male': {
      voice: 'own:en-ng-male',
      language: 'en-NG',
      sample: 'Ẹ káàárọ̀ — good morning. Abi you don hear? This is Nigerian English from Lagos.',
      note: 'Yoruba neural weights not live; demo uses Nigerian English.',
    },
    'own:yo-tunde': {
      voice: 'own:en-ng-male',
      language: 'en-NG',
      sample: 'Good morning. Abi you don hear? This is Nigerian English from Lagos.',
      note: 'Yoruba neural weights not live; demo uses Nigerian English.',
    },
    'own:ig-ng-female': {
      voice: 'own:en-ng-female',
      language: 'en-NG',
      sample: 'Ndewo — welcome. Please, take your seat. This is Nigerian English.',
      note: 'Igbo neural weights not live; demo uses Nigerian English.',
    },
    'own:ha-ng-male': {
      voice: 'own:en-ng-male',
      language: 'en-NG',
      sample: 'Sannu — hello. Somehow we can begin now. This is Nigerian English from Kano.',
      note: 'Hausa neural weights not live; demo uses Nigerian English.',
    },
    'own:pcm-ng-female': {
      voice: 'own:en-ng-female',
      language: 'en-NG',
      sample: 'How far, my guy? Abeg no vex — I dey find the place wey dem dey sell jollof.',
      note: 'Pidgin uses Nigerian English eSpeak path (Caribbean) until pcm neural weights publish.',
    },
    'own:zu-za-female': {
      voice: 'own:en-za-female',
      language: 'en-ZA',
      sample: 'Sawubona — hello. Welcome to Lugemi. This is South African English.',
      note: 'isiZulu neural weights not live; demo uses South African English (not Afrikaans).',
    },
    'own:xh-za-male': {
      voice: 'own:en-za-male',
      language: 'en-ZA',
      sample: 'Molo — hello. Welcome to Lugemi. This is South African English.',
      note: 'isiXhosa neural weights not live; demo uses South African English.',
    },
    'own:wo-sn-male': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Nanga def — bonjour. Bienvenue chez Lugemi, depuis Dakar.',
      note: 'Wolof neural weights not live; demo uses Senegalese French.',
    },
    'own:ff-sn-female': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Jam tan — bonjour. Bienvenue chez Lugemi.',
      note: 'Fulfulde neural weights not live; demo uses Senegalese French.',
    },
    'own:bm-ml-male': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'I ni ce — bonjour. Bienvenue chez Lugemi.',
      note: 'Bambara neural weights not live; demo uses West African French.',
    },
    'own:lg-ug-female': {
      voice: 'own:en-ke-female',
      language: 'en-KE',
      sample: 'Gyebaleko — hello. Welcome to Lugemi. This is East African English.',
      note: 'Luganda neural weights not live; demo uses Kenyan English.',
    },
    'own:ln-cd-male': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Mbote — bonjour. Bienvenue sur Lugemi, depuis Kinshasa.',
      note: 'Lingala neural weights not live; demo uses West African French (neural).',
    },
    // France French often lacks a live Kokoro weight and falls back to eSpeak WAV
    // (robotic / "shaky"). Prefer Senegal French neural for customer demos.
    'own:fr-fr-female': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Bonjour. Bienvenue chez Lugemi — démo en français.',
      note: 'France French neural weights not live; demo uses West African French (neural).',
    },
    'own:fr-fr-male': {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Bonjour. Bienvenue chez Lugemi — démo en français.',
      note: 'France French neural weights not live; demo uses West African French (neural).',
    },

    'own:rw-rw-female': {
      voice: 'own:en-ke-female',
      language: 'en-KE',
      sample: 'Muraho — hello. Welcome to Lugemi. This is East African English from Kigali.',
      note: 'Kinyarwanda neural weights not live; demo uses Kenyan English.',
    },
    'own:so-so-male': {
      voice: 'own:en-ke-male',
      language: 'en-KE',
      sample: 'Salaan — hello. Welcome to Lugemi. This is East African English.',
      note: 'Somali neural weights not live; demo uses Kenyan English.',
    },
    'own:ti-et-male': {
      voice: 'own:am-et-female',
      language: 'am-ET',
      sample: 'እንኳን ደህና መጡ ወደ ሉጌሚ።',
      note: 'Tigrinya neural weights not live; demo uses Amharic eSpeak.',
    },
    'own:sn-zw-female': {
      voice: 'own:en-za-female',
      language: 'en-ZA',
      sample: 'Mhoro — hello. Welcome to Lugemi. This is Southern African English.',
      note: 'Shona neural weights not live; demo uses South African English.',
    },
    'own:ny-mw-male': {
      voice: 'own:en-za-male',
      language: 'en-ZA',
      sample: 'Moni — hello. Welcome to Lugemi. This is Southern African English.',
      note: 'Chichewa neural weights not live; demo uses South African English.',
    },
  };

const LANG_REMAP: Record<string, { voice: string; language: string; sample: string; note: string }> =
  {
    ak: VOICE_REMAP['own:ak-gh-female']!,
    tw: VOICE_REMAP['own:ak-gh-female']!,
    ee: VOICE_REMAP['own:ee-gh-female']!,
    gaa: VOICE_REMAP['own:gaa-pack']!,
    ada: VOICE_REMAP['own:ada-pack']!,
    dag: VOICE_REMAP['own:dag-pack']!,
    yo: VOICE_REMAP['own:yo-ng-male']!,
    ig: VOICE_REMAP['own:ig-ng-female']!,
    ha: VOICE_REMAP['own:ha-ng-male']!,
    pcm: VOICE_REMAP['own:pcm-ng-female']!,
    zu: VOICE_REMAP['own:zu-za-female']!,
    xh: VOICE_REMAP['own:xh-za-male']!,
    wo: VOICE_REMAP['own:wo-sn-male']!,
    ff: VOICE_REMAP['own:ff-sn-female']!,
    bm: VOICE_REMAP['own:bm-ml-male']!,
    lg: VOICE_REMAP['own:lg-ug-female']!,
    ln: VOICE_REMAP['own:ln-cd-male']!,
    rw: VOICE_REMAP['own:rw-rw-female']!,
    so: VOICE_REMAP['own:so-so-male']!,
    ti: VOICE_REMAP['own:ti-et-male']!,
    sn: VOICE_REMAP['own:sn-zw-female']!,
    ny: VOICE_REMAP['own:ny-mw-male']!,
    // Prefer neural West African French over France eSpeak fallback in demos.
    fr: {
      voice: 'own:fr-sn-female',
      language: 'fr-SN',
      sample: 'Bonjour. Bienvenue chez Lugemi — démo en français.',
      note: 'France French neural weights not live; demo uses West African French (neural).',
    },
    // SEA / LATAM / MENA identity packs often ship with a nearest English Echo id —
    // remap demos onto verified eSpeak (or cultural English) paths for that language.
    fil: {
      voice: 'own:en-ph-female',
      language: 'en-PH',
      sample: 'Good morning po! Salamat po — welcome to Lugemi Filipino English.',
      note: 'Tagalog/Filipino neural weights not live; demo uses Filipino English.',
    },
    tl: {
      voice: 'own:en-ph-female',
      language: 'en-PH',
      sample: 'Good morning po! Salamat po — welcome to Lugemi Filipino English.',
      note: 'Tagalog neural weights not live; demo uses Filipino English.',
    },
    ceb: {
      voice: 'own:en-ph-male',
      language: 'en-PH',
      sample: 'Kumusta — welcome. This is Filipino English from the Visayas.',
      note: 'Cebuano neural weights not live; demo uses Filipino English.',
    },
    th: {
      voice: 'own:th-pack',
      language: 'th-TH',
      sample: 'สวัสดี ยินดีต้อนรับสู่ Lugemi',
      note: 'Thai eSpeak demo path (language pack voice).',
    },
    vi: {
      voice: 'own:vi-pack',
      language: 'vi-VN',
      sample: 'Xin chào, chào mừng bạn đến với Lugemi.',
      note: 'Vietnamese eSpeak demo path (language pack voice).',
    },
    ms: {
      voice: 'own:ms-pack',
      language: 'ms-MY',
      sample: 'Assalamualaikum. Selamat datang ke Lugemi.',
      note: 'Malay eSpeak demo path (language pack voice).',
    },
    id: {
      voice: 'own:id-pack',
      language: 'id-ID',
      sample: 'Halo, selamat datang di Lugemi.',
      note: 'Indonesian eSpeak demo path (language pack voice).',
    },
    jv: {
      voice: 'own:id-pack',
      language: 'id-ID',
      sample: 'Halo, selamat datang di Lugemi.',
      note: 'Javanese neural weights not live; demo uses Indonesian eSpeak.',
    },
    es: {
      voice: 'own:es-pack',
      language: 'es-MX',
      sample: 'Hola, bienvenido a Lugemi.',
      note: 'Spanish eSpeak demo path (language pack voice).',
    },
    pt: {
      voice: 'own:pt-ao-male',
      language: 'pt-BR',
      sample: 'Olá, bem-vindo à Lugemi.',
      note: 'Portuguese eSpeak demo path.',
    },
    ht: {
      voice: 'own:ht-pack',
      language: 'ht-HT',
      sample: 'Bonjou! Byenveni nan Lugemi.',
      note: 'Haitian Creole eSpeak demo path (language pack voice).',
    },
    ar: {
      voice: 'own:ar-eg-male',
      language: 'ar-EG',
      sample: 'أهلاً وسهلاً بكم في لوجيمي.',
      note: 'Arabic eSpeak demo path.',
    },
    ja: {
      voice: 'own:ja-pack',
      language: 'ja-JP',
      sample: 'こんにちは。Lugemiへようこそ。',
      note: 'Japanese eSpeak demo path.',
    },
    ko: {
      voice: 'own:ko-pack',
      language: 'ko-KR',
      sample: '안녕하세요. Lugemi에 오신 것을 환영합니다.',
      note: 'Korean eSpeak demo path.',
    },
    zh: {
      voice: 'own:zh-pack',
      language: 'zh-CN',
      sample: '你好，欢迎使用 Lugemi。',
      note: 'Mandarin eSpeak (cmn) demo path.',
    },
    cmn: {
      voice: 'own:zh-pack',
      language: 'zh-CN',
      sample: '你好，欢迎使用 Lugemi。',
      note: 'Mandarin eSpeak (cmn) demo path.',
    },
    yue: {
      voice: 'own:yue-pack',
      language: 'zh-HK',
      sample: '你好，欢迎使用 Lugemi。',
      note: 'Cantonese eSpeak demo path.',
    },
    hi: {
      voice: 'own:hi-pack',
      language: 'hi-IN',
      sample: 'नमस्ते, लुगेमी में आपका स्वागत है।',
      note: 'Hindi eSpeak demo path.',
    },
    de: {
      voice: 'own:de-pack',
      language: 'de-DE',
      sample: 'Guten Tag, willkommen bei Lugemi.',
      note: 'German eSpeak demo path.',
    },
    it: {
      voice: 'own:it-pack',
      language: 'it-IT',
      sample: 'Ciao, benvenuto su Lugemi.',
      note: 'Italian eSpeak demo path.',
    },
    nl: {
      voice: 'own:nl-pack',
      language: 'nl-NL',
      sample: 'Hallo, welkom bij Lugemi.',
      note: 'Dutch eSpeak demo path.',
    },
    ru: {
      voice: 'own:ru-pack',
      language: 'ru-RU',
      sample: 'Здравствуйте, добро пожаловать в Lugemi.',
      note: 'Russian eSpeak demo path.',
    },
    tr: {
      voice: 'own:tr-pack',
      language: 'tr-TR',
      sample: 'Merhaba, Lugemi’ye hoş geldiniz.',
      note: 'Turkish eSpeak demo path.',
    },
  };

function normalizeVoiceId(voice: string | undefined): string | null {
  if (!voice?.trim()) return null;
  const raw = voice.trim();
  if (isOwnTtsVoice(raw)) return raw;
  if (/^[a-z0-9][a-z0-9._-]*$/i.test(raw)) return `own:${raw}`;
  return null;
}

function primaryLang(language: string): string {
  return normalizeLocaleKey(language).split('-')[0] ?? '';
}

/** Pidgin / English-lexifier samples can keep caller text on an English eSpeak path. */
function keepCallerText(requestedLanguage: string, remappedLanguage: string): boolean {
  const req = primaryLang(requestedLanguage);
  const dest = primaryLang(remappedLanguage);
  if (req === 'pcm' && dest === 'en') return true;
  if (req === 'en' && dest === 'en') return true;
  if (req === 'fr' && dest === 'fr') return true;
  return false;
}

/** Dedicated demo-safe Echo voices for English regions (when published in the catalog). */
const ENGLISH_REGION_VOICE: Record<string, string> = {
  'en-us': 'own:en-us-female',
  'en-gb': 'own:en-gb-female',
  'en-ca': 'own:en-ca-female',
  'en-au': 'own:en-au-female',
  'en-nz': 'own:en-nz-female',
  'en-gh': 'own:en-gh-female',
  'en-ng': 'own:en-ng-female',
  'en-ke': 'own:en-ke-female',
  'en-za': 'own:en-za-female',
  'en-ph': 'own:en-ph-female',
  'en-ie': 'own:en-gb-female',
  'en-in': 'own:en-gb-female',
  'en-sg': 'own:en-ph-female',
  'en-cm': 'own:en-ng-female',
  'en-lr': 'own:en-gh-female',
  'en-sl': 'own:en-gh-female',
};

/**
 * Gateway rejects voices that do not speak the requested language natively.
 * Align demo targets onto a verified path so Play never 422s for world-market packs
 * that share a nearest curated Echo id (e.g. Thai → en-kofi, Tagalog → en-ph).
 */
function alignVoiceToLanguage(input: {
  voice: string;
  language: string;
  text: string;
  requestedVoice: string | null;
  requestedLanguage: string;
}): DemoSpeechTarget | null {
  const resolved = resolveOwnTtsVoice(input.voice);
  if (!resolved) return null;
  if (voiceSpeaksNatively(resolved, input.language)) return null;

  const primary = primaryLang(input.language);

  if (primary === 'en') {
    const regionKey = normalizeLocaleKey(input.language);
    const dedicated = ENGLISH_REGION_VOICE[regionKey];
    if (dedicated && resolveOwnTtsVoice(dedicated)) {
      const dest = resolveOwnTtsVoice(dedicated)!;
      // Gateway requires voice locale region == requested en region — speak in the voice's locale.
      const language = voiceSpeaksNatively(dest, input.language)
        ? input.language
        : dest.locale || 'en-US';
      if (isDemoSafeVoice(dedicated, language)) {
        return {
          voice: dedicated,
          language,
          text: input.text,
          remapped: true,
          requestedVoice: input.requestedVoice,
          requestedLanguage: input.requestedLanguage,
          note: `Demo routes ${input.language} via Echo ${dedicated} (${language}).`,
        };
      }
    }
    // Pidgin / non-en locale voices used as nearest for English packs → cultural English.
    let fallbackVoice = input.voice;
    let fallbackLocale = resolved.locale || 'en-US';
    if (!fallbackLocale.toLowerCase().startsWith('en')) {
      fallbackVoice =
        ENGLISH_REGION_VOICE[normalizeLocaleKey(fallbackLocale)] ||
        (resolved.id.includes('pcm') || fallbackLocale.toLowerCase().includes('ng')
          ? 'own:en-ng-female'
          : 'own:en-us-female');
      fallbackLocale = resolveOwnTtsVoice(fallbackVoice)?.locale || 'en-US';
    } else if (!voiceSpeaksNatively(resolved, fallbackLocale)) {
      fallbackVoice = ENGLISH_REGION_VOICE[normalizeLocaleKey(fallbackLocale)] || 'own:en-us-female';
      fallbackLocale = resolveOwnTtsVoice(fallbackVoice)?.locale || 'en-US';
    }
    return {
      voice: fallbackVoice,
      language: fallbackLocale,
      text: input.text,
      remapped: true,
      requestedVoice: input.requestedVoice,
      requestedLanguage: input.requestedLanguage,
      note: `No dedicated ${input.language} Echo voice yet; demo uses ${fallbackLocale}.`,
    };
  }

  const byLang = LANG_REMAP[primary];
  if (byLang && isDemoSafeVoice(byLang.voice, byLang.language)) {
    const destResolved = resolveOwnTtsVoice(byLang.voice);
    const language =
      destResolved && voiceSpeaksNatively(destResolved, input.language)
        ? input.language
        : byLang.language;
    return {
      voice: byLang.voice,
      language,
      text: keepCallerText(input.requestedLanguage, language) ? input.text : byLang.sample,
      remapped: true,
      requestedVoice: input.requestedVoice,
      requestedLanguage: input.requestedLanguage,
      note: byLang.note,
    };
  }

  const packId = `own:${primary}-pack`;
  if (resolveOwnTtsVoice(packId) && isDemoSafeVoice(packId, input.language)) {
    return {
      voice: packId,
      language: input.language,
      text: input.text,
      remapped: true,
      requestedVoice: input.requestedVoice,
      requestedLanguage: input.requestedLanguage,
      note: `Demo uses language-default Echo pack ${packId} for ${input.language}.`,
    };
  }

  // Last resort: speak with the assigned voice in its own locale.
  const alignedLocale = resolved.locale || 'en-US';
  return {
    voice: input.voice,
    language: alignedLocale,
    text: keepCallerText(input.requestedLanguage, alignedLocale)
      ? input.text
      : 'Welcome to Lugemi. This accent pack plays on a verified Echo demo path.',
    remapped: true,
    requestedVoice: input.requestedVoice,
    requestedLanguage: input.requestedLanguage,
    note: `Assigned voice does not speak ${input.language}; demo uses ${alignedLocale}.`,
  };
}

export function resolveDemoSpeechTarget(input: {
  text: string;
  language: string;
  voice?: string;
}): DemoSpeechTarget {
  const requestedLanguage = input.language.trim();
  const requestedVoice = normalizeVoiceId(input.voice);
  const resolvedRequested = requestedVoice ? resolveOwnTtsVoice(requestedVoice) : undefined;

  const voice =
    requestedVoice && resolvedRequested
      ? requestedVoice
      : resolvedRequested?.id ?? null;
  let language = requestedLanguage;

  // Prefer catalog locale when caller only sent a bare language and a curated voice.
  if (voice && resolvedRequested && !language.includes('-')) {
    language = resolvedRequested.locale || language;
  }

  /**
   * Explicit VOICE_REMAP must win even when the source voice is "demo-safe" eSpeak.
   * Otherwise France French (espeak WAV) never upgrades to Senegal French neural, and
   * to-language demos keep the shaky robotic path while from-language Kokoro sounds clean.
   */
  const forcedVoiceRemap = voice ? VOICE_REMAP[voice] : undefined;
  if (forcedVoiceRemap && isDemoSafeVoice(forcedVoiceRemap.voice, forcedVoiceRemap.language)) {
    return {
      voice: forcedVoiceRemap.voice,
      language: forcedVoiceRemap.language,
      text: keepCallerText(requestedLanguage, forcedVoiceRemap.language)
        ? input.text
        : forcedVoiceRemap.sample,
      remapped: true,
      requestedVoice,
      requestedLanguage,
      note: forcedVoiceRemap.note,
    };
  }

  if (voice && isDemoSafeVoice(voice, language)) {
    const aligned = alignVoiceToLanguage({
      voice,
      language,
      text: input.text,
      requestedVoice,
      requestedLanguage,
    });
    if (aligned) return aligned;
    return {
      voice,
      language,
      text: input.text,
      remapped: false,
      requestedVoice,
      requestedLanguage,
      note: null,
    };
  }

  const remap =
    LANG_REMAP[primaryLang(requestedLanguage)] ||
    (voice ? LANG_REMAP[primaryLang(resolveOwnTtsVoice(voice)?.locale ?? '')] : undefined);

  if (remap && isDemoSafeVoice(remap.voice, remap.language)) {
    const text = keepCallerText(requestedLanguage, remap.language)
      ? input.text
      : remap.sample;
    return {
      voice: remap.voice,
      language: remap.language,
      text,
      remapped: true,
      requestedVoice,
      requestedLanguage,
      note: remap.note,
    };
  }

  // Last resort: any demo-safe curated voice for the requested language family.
  if (!voice) {
    const fallback =
      LANG_REMAP[primaryLang(requestedLanguage)] ??
      ({
        voice: 'own:en-us-female',
        language: 'en-US',
        sample: input.text,
        note: 'Fell back to American English demo voice.',
      } as const);
    return {
      voice: fallback.voice,
      language: fallback.language,
      text: keepCallerText(requestedLanguage, fallback.language) ? input.text : fallback.sample,
      remapped: true,
      requestedVoice,
      requestedLanguage,
      note: fallback.note,
    };
  }

  // Voice exists but still not demo-safe (e.g. unknown pack) — cultural English US.
  const primary = primaryLang(language);
  if (FORMANT_ONLY_WITHOUT_NEURAL.has(primary) || !isDemoSafeVoice(voice, language)) {
    return {
      voice: 'own:en-us-female',
      language: 'en-US',
      text: 'Welcome to Lugemi. This accent pack will play with a verified demo voice until native weights publish.',
      remapped: true,
      requestedVoice,
      requestedLanguage,
      note: `No verified demo path for ${voice}; using American English.`,
    };
  }

  return {
    voice,
    language,
    text: input.text,
    remapped: false,
    requestedVoice,
    requestedLanguage,
    note: null,
  };
}
