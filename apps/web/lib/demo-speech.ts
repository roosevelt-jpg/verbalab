/**
 * Marketing demo speech — Lugemi Echo voices via `POST /v1/demo/speech`.
 *
 * Pass any `own:*` / bare Echo key plus a BCP-47 language. The API remaps
 * formant-only L1 packs to cultural English/French of the same country so Play
 * never falls through to the wrong language or silent failure.
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
  'sw-aisha': {
    id: 'sw-aisha',
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
  'am-hanna': {
    id: 'am-hanna',
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
  'fr-fr-male': {
    id: 'fr-fr-male',
    label: 'Louis · France',
    lang: 'fr-FR',
    voice: 'own:fr-fr-male',
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
  'en-us-male': {
    id: 'en-us-male',
    label: 'Michael · United States',
    lang: 'en-US',
    voice: 'own:en-us-male',
    englishLocale: 'en-US',
  },
  'en-gb-female': {
    id: 'en-gb-female',
    label: 'Emma · United Kingdom',
    lang: 'en-GB',
    voice: 'own:en-gb-female',
    englishLocale: 'en-GB',
  },
  'en-gb-male': {
    id: 'en-gb-male',
    label: 'George · United Kingdom',
    lang: 'en-GB',
    voice: 'own:en-gb-male',
    englishLocale: 'en-GB',
  },
  'en-ca-female': {
    id: 'en-ca-female',
    label: 'Chloe · Canada',
    lang: 'en-CA',
    voice: 'own:en-ca-female',
    englishLocale: 'en-CA',
  },
  'en-ca-male': {
    id: 'en-ca-male',
    label: 'Liam · Canada',
    lang: 'en-CA',
    voice: 'own:en-ca-male',
    englishLocale: 'en-CA',
  },
  'en-au-female': {
    id: 'en-au-female',
    label: 'Mia · Australia',
    lang: 'en-AU',
    voice: 'own:en-au-female',
    englishLocale: 'en-AU',
  },
  'en-au-male': {
    id: 'en-au-male',
    label: 'Jack · Australia',
    lang: 'en-AU',
    voice: 'own:en-au-male',
    englishLocale: 'en-AU',
  },
  'en-nz-female': {
    id: 'en-nz-female',
    label: 'Ruby · New Zealand',
    lang: 'en-NZ',
    voice: 'own:en-nz-female',
    englishLocale: 'en-NZ',
  },
  'en-nz-male': {
    id: 'en-nz-male',
    label: 'Oliver · New Zealand',
    lang: 'en-NZ',
    voice: 'own:en-nz-male',
    englishLocale: 'en-NZ',
  },
  'en-gh-female': {
    id: 'en-gh-female',
    label: 'Ama · Ghanaian English',
    lang: 'en-GH',
    voice: 'own:en-gh-female',
    englishLocale: 'en-GH',
  },
  'en-gh-male': {
    id: 'en-gh-male',
    label: 'Kwame · Ghanaian English',
    lang: 'en-GH',
    voice: 'own:en-gh-male',
    englishLocale: 'en-GH',
  },
  'en-kofi': {
    id: 'en-kofi',
    label: 'Kofi · Ghanaian English',
    lang: 'en-GH',
    voice: 'own:en-kofi',
    englishLocale: 'en-GH',
  },
  'en-ng-female': {
    id: 'en-ng-female',
    label: 'Chioma · Nigerian English',
    lang: 'en-NG',
    voice: 'own:en-ng-female',
    englishLocale: 'en-NG',
  },
  'en-ng-male': {
    id: 'en-ng-male',
    label: 'Emeka · Nigerian English',
    lang: 'en-NG',
    voice: 'own:en-ng-male',
    englishLocale: 'en-NG',
  },
  'en-ke-female': {
    id: 'en-ke-female',
    label: 'Wanjiku · Kenyan English',
    lang: 'en-KE',
    voice: 'own:en-ke-female',
    englishLocale: 'en-KE',
  },
  'en-ke-male': {
    id: 'en-ke-male',
    label: 'Kamau · Kenyan English',
    lang: 'en-KE',
    voice: 'own:en-ke-male',
    englishLocale: 'en-KE',
  },
  'en-za-female': {
    id: 'en-za-female',
    label: 'Lerato · South African English',
    lang: 'en-ZA',
    voice: 'own:en-za-female',
    englishLocale: 'en-ZA',
  },
  'en-za-male': {
    id: 'en-za-male',
    label: 'Sipho · South African English',
    lang: 'en-ZA',
    voice: 'own:en-za-male',
    englishLocale: 'en-ZA',
  },
  'en-ph-female': {
    id: 'en-ph-female',
    label: 'Maya · Filipino English',
    lang: 'en-PH',
    voice: 'own:en-ph-female',
    englishLocale: 'en-PH',
  },
  'en-ph-male': {
    id: 'en-ph-male',
    label: 'Luis · Filipino English',
    lang: 'en-PH',
    voice: 'own:en-ph-male',
    englishLocale: 'en-PH',
  },
  'af-za-female': {
    id: 'af-za-female',
    label: 'Annelie · Afrikaans',
    lang: 'af-ZA',
    voice: 'own:af-za-female',
    englishLocale: 'en-ZA',
  },
  'pt-ao-male': {
    id: 'pt-ao-male',
    label: 'Nzinga · Luanda',
    lang: 'pt-AO',
    voice: 'own:pt-ao-male',
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

function normalizeVoiceKey(voiceId: string | undefined): string | null {
  if (!voiceId?.trim()) return null;
  const raw = voiceId.trim();
  const key = raw.startsWith('own:') ? raw.slice(4) : raw;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(key)) return null;
  return key.toLowerCase();
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
  'en-IE': 'own:en-gb-female',
  'en-IN': 'own:en-gb-female',
};

function resolveProfile(input: {
  voiceId?: string;
  lang?: string;
  label?: string;
}): DemoVoiceProfile {
  const key = normalizeVoiceKey(input.voiceId);
  if (key && DEMO_VOICE_PROFILES[key]) {
    return { ...DEMO_VOICE_PROFILES[key]!, label: input.label ?? DEMO_VOICE_PROFILES[key]!.label };
  }
  if (key) {
    return {
      id: key,
      label: input.label ?? key,
      lang: input.lang ?? 'en-US',
      voice: `own:${key}`,
    };
  }
  if (input.label) {
    const byLabel = Object.values(DEMO_VOICE_PROFILES).find((p) => p.label === input.label);
    if (byLabel) return { ...byLabel, label: input.label };
  }
  // Never fall back to a random African L1 voice — prefer US English when unspecified.
  return {
    ...DEMO_VOICE_PROFILES['en-us-female']!,
    label: input.label ?? DEMO_VOICE_PROFILES['en-us-female']!.label,
    lang: input.lang ?? 'en-US',
  };
}

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
      voice: ENGLISH_LOCALE_VOICE[localeKey] ?? profile.voice ?? 'own:en-us-female',
    };
  }
  return {
    language: lang,
    voice: profile.voice ?? (profile.id ? `own:${profile.id}` : 'own:en-us-female'),
  };
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

export type StudioSpeechResult = {
  mode: 'server' | 'neural' | 'studio';
  profile: DemoVoiceProfile;
  engine?: string | null;
  verification?: string | null;
};

async function fetchSpeechAudio(input: {
  text: string;
  language: string;
  voice: string;
  token?: string | null;
  signal: AbortSignal;
}): Promise<{ blob: Blob; engine: string | null; verification: string | null; mode: StudioSpeechResult['mode'] }> {
  // Authenticated Studio / Console: metered neural path when OWN_TTS is wired.
  if (input.token) {
    const studioRes = await fetch(`${API_URL}/v1/tts/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({
        text: input.text.slice(0, 2500),
        language: input.language,
        voice: input.voice,
        format: 'mp3',
      }),
      signal: input.signal,
    });
    if (studioRes.ok) {
      const contentType = studioRes.headers.get('content-type') ?? '';
      if (!contentType.includes('json') && !contentType.includes('text')) {
        const blob = await studioRes.blob();
        if (blob.size >= 64) {
          const engine = studioRes.headers.get('x-lugemi-synth-engine');
          const verification = studioRes.headers.get('x-lugemi-verification-status');
          const neural = /neural|kokoro|piper/i.test(engine ?? '') || verification === 'neural_unreviewed';
          return {
            blob,
            engine,
            verification,
            mode: neural ? 'neural' : 'studio',
          };
        }
      }
    }
  }

  const res = await fetch(`${API_URL}/v1/demo/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.text.slice(0, 300), language: input.language, voice: input.voice }),
    signal: input.signal,
  });
  if (!res.ok) throw new Error(await readError(res));
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json') || contentType.includes('text')) {
    throw new Error('Speech endpoint returned non-audio content');
  }
  const blob = await res.blob();
  if (blob.size < 64) throw new Error('Speech audio payload too small');
  const engine = res.headers.get('x-lugemi-synth-engine');
  const verification = res.headers.get('x-lugemi-verification-status');
  const neural = /neural|kokoro|piper/i.test(engine ?? '') || verification === 'neural_unreviewed';
  return { blob, engine, verification, mode: neural ? 'neural' : 'server' };
}

/**
 * Platform Play: prefers authenticated `/v1/tts/synthesize` (Kokoro/Piper when
 * OWN_TTS_URL is live), else public `/v1/demo/speech` with the same own:* voices.
 */
export async function playDemoSpeech(input: {
  text: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  /** Clerk session JWT or lg_live_/lg_test_ machine key for neural Studio path. */
  token?: string | null;
  onStarted?: () => void;
}): Promise<StudioSpeechResult> {
  const profile = resolveProfile(input);
  const { language, voice } = resolveRequest(profile, input.lang);

  stopDemoSpeech();
  const controller = new AbortController();
  activeRequest = controller;
  const { blob, engine, verification, mode } = await fetchSpeechAudio({
    text: input.text,
    language,
    voice,
    token: input.token,
    signal: controller.signal,
  });
  if (activeRequest !== controller) return { mode, profile, engine, verification };
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
  return { mode, profile, engine, verification };
}
