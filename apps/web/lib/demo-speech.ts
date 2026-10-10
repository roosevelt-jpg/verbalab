/**
 * Marketing demo speech — Lugemi Echo voices via `POST /v1/demo/speech`.
 *
 * Only demo-safe varieties (eSpeak-backed or neural-live) are listed here.
 * Voices without verified intelligible synthesis (Yoruba, Zulu, Akan, etc. until
 * neural weights publish) are omitted — the API returns capability_unavailable
 * rather than formant/beep placeholders.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type DemoVoiceProfile = {
  id: string;
  label: string;
  /** BCP-47 language this voice speaks natively (also sent with the request). */
  lang: string;
  /** Lugemi native voice (`own:*`) used when the requested language matches `lang`. */
  voice?: string;
  /** Local English accent for this speaker when the script is English, e.g. `en-NG`. */
  englishLocale?: string;
};

/** Customer-facing profiles — must stay aligned with apps/api demo-catalogue. */
export const DEMO_VOICE_PROFILES: Record<string, DemoVoiceProfile> = {
  amara: {
    id: 'amara',
    label: 'Aisha · Nairobi',
    lang: 'sw-KE',
    voice: 'own:sw-ke-female',
    englishLocale: 'en-KE',
  },
  'sw-ke-female': {
    id: 'sw-ke-female',
    label: 'Aisha · Nairobi',
    lang: 'sw-KE',
    voice: 'own:sw-ke-female',
    englishLocale: 'en-KE',
  },
  'am-et-female': {
    id: 'am-et-female',
    label: 'Hanna · Addis',
    lang: 'am-ET',
    voice: 'own:am-et-female',
  },
  'ar-eg-male': {
    id: 'ar-eg-male',
    label: 'Omar · Cairo',
    lang: 'ar-EG',
    voice: 'own:ar-eg-male',
  },
  'fr-fr-female': {
    id: 'fr-fr-female',
    label: 'Camille · France',
    lang: 'fr-FR',
    voice: 'own:fr-fr-female',
  },
  'fr-sn-female': {
    id: 'fr-sn-female',
    label: 'Awa · Dakar',
    lang: 'fr-SN',
    voice: 'own:fr-sn-female',
  },
  'en-us-female': {
    id: 'en-us-female',
    label: 'Ava · United States',
    lang: 'en-US',
    voice: 'own:en-us-female',
    englishLocale: 'en-US',
  },
  'en-gb-female': {
    id: 'en-gb-female',
    label: 'Emma · United Kingdom',
    lang: 'en-GB',
    voice: 'own:en-gb-female',
    englishLocale: 'en-GB',
  },
  'en-au-female': {
    id: 'en-au-female',
    label: 'Mia · Australia',
    lang: 'en-AU',
    voice: 'own:en-au-female',
    englishLocale: 'en-AU',
  },
  'en-nz-female': {
    id: 'en-nz-female',
    label: 'Ruby · New Zealand',
    lang: 'en-NZ',
    voice: 'own:en-nz-female',
    englishLocale: 'en-NZ',
  },
  'en-gh-female': {
    id: 'en-gh-female',
    label: 'Ama · Ghanaian English',
    lang: 'en-GH',
    voice: 'own:en-gh-female',
    englishLocale: 'en-GH',
  },
  'en-ng-female': {
    id: 'en-ng-female',
    label: 'Chioma · Nigerian English',
    lang: 'en-NG',
    voice: 'own:en-ng-female',
    englishLocale: 'en-NG',
  },
  'af-za-female': {
    id: 'af-za-female',
    label: 'Annelie · Afrikaans',
    lang: 'af-ZA',
    voice: 'own:af-za-female',
    englishLocale: 'en-ZA',
  },
  // Legacy chip ids remapped to demo-safe English varieties (not fabricated native L1).
  abe: { id: 'abe', label: 'Chioma · Nigerian English', lang: 'en-NG', voice: 'own:en-ng-female', englishLocale: 'en-NG' },
  thandi: {
    id: 'thandi',
    label: 'Lerato · South African English',
    lang: 'en-ZA',
    voice: 'own:en-za-female',
    englishLocale: 'en-ZA',
  },
  kwame: {
    id: 'kwame',
    label: 'Ama · Ghanaian English',
    lang: 'en-GH',
    voice: 'own:en-gh-female',
    englishLocale: 'en-GH',
  },
  agent: { id: 'agent', label: 'Aisha · Nairobi', lang: 'sw-KE', voice: 'own:sw-ke-female' },
  user: { id: 'user', label: 'Ava · United States', lang: 'en-US', voice: 'own:en-us-female' },
};

const LANG_ALIASES: Record<string, string> = { tw: 'ak', twi: 'ak', fat: 'ak' };

function baseLang(lang: string): string {
  const primary = lang.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return LANG_ALIASES[primary] ?? primary;
}

let activeAudio: HTMLAudioElement | null = null;
let activeRequest: AbortController | null = null;

export function stopDemoSpeech() {
  if (typeof window === 'undefined') return;
  activeRequest?.abort();
  activeRequest = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
}

/** Cultural English Echo voices for marketing demos (region → preferred own:*). */
const ENGLISH_LOCALE_VOICE: Record<string, string> = {
  'en-GH': 'own:en-gh-female',
  'en-NG': 'own:en-ng-female',
  'en-KE': 'own:en-ke-female',
  'en-ZA': 'own:en-za-female',
  'en-PH': 'own:en-ph-female',
  'en-US': 'own:en-us-female',
  'en-GB': 'own:en-gb-female',
  'en-CA': 'own:en-ca-female',
  'en-AU': 'own:en-au-female',
  'en-NZ': 'own:en-nz-female',
};

function resolveRequest(profile: DemoVoiceProfile, requestedLang: string | undefined) {
  const lang = requestedLang ?? profile.lang;
  const base = baseLang(lang);
  if (base === 'en') {
    const raw = (lang.includes('-') ? lang : profile.englishLocale ?? 'en').replace('_', '-');
    const localeKey = /^en-[a-z]{2}$/i.test(raw)
      ? `en-${raw.slice(3).toUpperCase()}`
      : profile.englishLocale ?? raw;
    return {
      language: localeKey,
      voice: ENGLISH_LOCALE_VOICE[localeKey] ?? profile.voice,
    };
  }
  const voice = profile.voice && baseLang(profile.lang) === base ? profile.voice : profile.voice;
  return { language: lang, voice };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string; code?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // non-JSON error body
  }
  return `Native voice playback failed (HTTP ${res.status})`;
}

export async function playDemoSpeech(input: {
  text: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  onStarted?: () => void;
}): Promise<{ mode: 'server'; profile: DemoVoiceProfile }> {
  const base =
    (input.voiceId && DEMO_VOICE_PROFILES[input.voiceId]) ||
    Object.values(DEMO_VOICE_PROFILES).find((p) => p.label === input.label) ||
    DEMO_VOICE_PROFILES.amara!;
  const profile: DemoVoiceProfile = { ...base, label: input.label ?? base.label };
  const { language, voice } = resolveRequest(profile, input.lang);

  stopDemoSpeech();
  const controller = new AbortController();
  activeRequest = controller;
  const res = await fetch(`${API_URL}/v1/demo/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.text.slice(0, 300), language, voice }),
    signal: controller.signal,
  });
  if (!res.ok) throw new Error(await readError(res));

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json') || contentType.includes('text')) {
    throw new Error('Speech endpoint returned non-audio content');
  }

  const blob = await res.blob();
  if (blob.size < 64) throw new Error('Speech audio payload too small');
  if (activeRequest !== controller) return { mode: 'server', profile };
  activeRequest = null;

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  activeAudio = audio;
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (activeAudio === audio) activeAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };
    void audio
      .play()
      .then(() => input.onStarted?.())
      .catch(reject);
  });
  return { mode: 'server', profile };
}
