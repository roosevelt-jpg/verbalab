/**
 * Marketing demo speech — always Lugemi native voices via the API (`POST /v1/demo/speech`).
 * Never falls back to browser speech or stock voices: those sound like a foreigner
 * speaking the language. Cultural English varieties (GH/NG/KE/PH/ZA) resolve to own:* Echo voices.
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

export const DEMO_VOICE_PROFILES: Record<string, DemoVoiceProfile> = {
  abe: { id: 'abe', label: 'Abe · Lagos', lang: 'yo-NG', voice: 'own:yo-ng-male', englishLocale: 'en-NG' },
  amara: { id: 'amara', label: 'Amara · Nairobi', lang: 'sw-KE', voice: 'own:sw-ke-female', englishLocale: 'en-KE' },
  thandi: { id: 'thandi', label: 'Thandi · Johannesburg', lang: 'zu-ZA', voice: 'own:zu-za-female', englishLocale: 'en-ZA' },
  kwame: { id: 'kwame', label: 'Kwame · Accra', lang: 'ak-GH', voice: 'own:ak-gh-female', englishLocale: 'en-GH' },
  'sw-ke-female': { id: 'sw-ke-female', label: 'Aisha · Nairobi', lang: 'sw-KE', voice: 'own:sw-ke-female', englishLocale: 'en-KE' },
  'yo-ng-male': { id: 'yo-ng-male', label: 'Tunde · Lagos', lang: 'yo-NG', voice: 'own:yo-ng-male', englishLocale: 'en-NG' },
  'am-et-female': { id: 'am-et-female', label: 'Hanna · Addis', lang: 'am-ET', voice: 'own:am-et-female' },
  'zu-za-female': { id: 'zu-za-female', label: 'Thandi · Durban', lang: 'zu-ZA', voice: 'own:zu-za-female', englishLocale: 'en-ZA' },
  'ar-eg-male': { id: 'ar-eg-male', label: 'Omar · Cairo', lang: 'ar-EG', voice: 'own:ar-eg-male' },
  'fr-sn-female': { id: 'fr-sn-female', label: 'Awa · Dakar', lang: 'fr-SN', voice: 'own:fr-sn-female' },
  'ha-ng-male': { id: 'ha-ng-male', label: 'Sani · Kano', lang: 'ha-NG', voice: 'own:ha-ng-male', englishLocale: 'en-NG' },
  'ak-gh-female': { id: 'ak-gh-female', label: 'Akosua · Accra', lang: 'ak-GH', voice: 'own:ak-gh-female', englishLocale: 'en-GH' },
  agent: { id: 'agent', label: 'Agent', lang: 'sw-KE' },
  user: { id: 'user', label: 'User', lang: 'en' },
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
  'en-GH': 'own:en-gh-male',
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
      voice: ENGLISH_LOCALE_VOICE[localeKey],
    };
  }
  const voice = profile.voice && baseLang(profile.lang) === base ? profile.voice : undefined;
  return { language: lang, voice };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
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
  const blob = await res.blob();
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
