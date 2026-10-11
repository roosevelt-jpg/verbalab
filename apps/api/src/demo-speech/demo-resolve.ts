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
      voice: 'own:fr-fr-male',
      language: 'fr-FR',
      sample: 'Mbote — bonjour. Bienvenue sur Lugemi, depuis Kinshasa.',
      note: 'Lingala neural weights not live; demo uses French.',
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

export function resolveDemoSpeechTarget(input: {
  text: string;
  language: string;
  voice?: string;
}): DemoSpeechTarget {
  const requestedLanguage = input.language.trim();
  const requestedVoice = normalizeVoiceId(input.voice);
  const resolvedRequested = requestedVoice ? resolveOwnTtsVoice(requestedVoice) : undefined;

  let voice =
    requestedVoice && resolvedRequested
      ? requestedVoice
      : resolvedRequested?.id ?? null;
  let language = requestedLanguage;

  // Prefer catalog locale when caller only sent a bare language and a curated voice.
  if (voice && resolvedRequested && !language.includes('-')) {
    language = resolvedRequested.locale || language;
  }

  if (voice && isDemoSafeVoice(voice, language)) {
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
    (voice && VOICE_REMAP[voice]) ||
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
