/** Client-side marketing demo speech — works without API keys via Web Speech API. */

export type DemoVoiceProfile = {
  id: string;
  label: string;
  /** BCP-47 hint for speechSynthesis */
  lang: string;
  /** Preferred OpenAI TTS voice when server demo is available */
  openaiVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  rate?: number;
  pitch?: number;
};

export const DEMO_VOICE_PROFILES: Record<string, DemoVoiceProfile> = {
  abe: {
    id: 'abe',
    label: 'Abe · Lagos',
    lang: 'en-NG',
    openaiVoice: 'onyx',
    rate: 0.95,
    pitch: 0.95,
  },
  amara: {
    id: 'amara',
    label: 'Amara · Nairobi',
    lang: 'sw-KE',
    openaiVoice: 'nova',
    rate: 0.98,
    pitch: 1.05,
  },
  thandi: {
    id: 'thandi',
    label: 'Thandi · Johannesburg',
    lang: 'en-ZA',
    openaiVoice: 'shimmer',
    rate: 1,
    pitch: 1.08,
  },
  kwame: {
    id: 'kwame',
    label: 'Kwame · Accra',
    lang: 'en-GH',
    openaiVoice: 'echo',
    rate: 0.97,
    pitch: 0.9,
  },
  'sw-ke-female': {
    id: 'sw-ke-female',
    label: 'Aisha · Nairobi',
    lang: 'sw',
    openaiVoice: 'nova',
    rate: 0.98,
    pitch: 1.05,
  },
  'yo-ng-male': {
    id: 'yo-ng-male',
    label: 'Tunde · Lagos',
    lang: 'en-NG',
    openaiVoice: 'onyx',
    rate: 0.95,
    pitch: 0.92,
  },
  'am-et-female': {
    id: 'am-et-female',
    label: 'Hanna · Addis',
    lang: 'am',
    openaiVoice: 'shimmer',
    rate: 0.95,
    pitch: 1.05,
  },
  'zu-za-female': {
    id: 'zu-za-female',
    label: 'Thandi · Durban',
    lang: 'zu',
    openaiVoice: 'nova',
    rate: 1,
    pitch: 1.05,
  },
  'ar-eg-male': {
    id: 'ar-eg-male',
    label: 'Omar · Cairo',
    lang: 'ar-EG',
    openaiVoice: 'onyx',
    rate: 0.95,
    pitch: 0.9,
  },
  'fr-sn-female': {
    id: 'fr-sn-female',
    label: 'Awa · Dakar',
    lang: 'fr-FR',
    openaiVoice: 'shimmer',
    rate: 1,
    pitch: 1.05,
  },
  agent: {
    id: 'agent',
    label: 'Agent',
    lang: 'sw',
    openaiVoice: 'nova',
    rate: 0.98,
    pitch: 1,
  },
  user: {
    id: 'user',
    label: 'User',
    lang: 'sw',
    openaiVoice: 'echo',
    rate: 1,
    pitch: 0.95,
  },
};

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopDemoSpeech() {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  activeUtterance = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
}

function pickBrowserVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split('-')[0]?.toLowerCase() ?? '';
  const byPrefix = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (byPrefix) return byPrefix;
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0] ?? null;
}

async function playViaServer(
  text: string,
  profile: DemoVoiceProfile,
  onStarted?: () => void,
): Promise<boolean> {
  try {
    const res = await fetch('/api/demo/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 500),
        voiceId: profile.id,
        openaiVoice: profile.openaiVoice ?? 'alloy',
        lang: profile.lang,
      }),
    });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await res.json()) as { mode?: string };
      return body.mode !== 'browser';
    }
    const blob = await res.blob();
    if (!blob.size) return false;
    stopDemoSpeech();
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
        .then(() => onStarted?.())
        .catch(reject);
    });
    return true;
  } catch {
    return false;
  }
}

function playViaBrowser(
  text: string,
  profile: DemoVoiceProfile,
  onStarted?: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis unavailable in this browser'));
      return;
    }
    stopDemoSpeech();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 500));
    utter.lang = profile.lang;
    utter.rate = profile.rate ?? 1;
    utter.pitch = profile.pitch ?? 1;
    const voice = pickBrowserVoice(profile.lang);
    if (voice) utter.voice = voice;
    activeUtterance = utter;
    utter.onend = () => {
      if (activeUtterance === utter) activeUtterance = null;
      resolve();
    };
    utter.onerror = () => {
      if (activeUtterance === utter) activeUtterance = null;
      reject(new Error('Speech synthesis failed'));
    };
    // Chrome often needs voices loaded asynchronously
    const speak = () => {
      window.speechSynthesis.speak(utter);
      onStarted?.();
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = pickBrowserVoice(profile.lang);
        if (v) utter.voice = v;
        speak();
      };
      // Fallback if event never fires
      setTimeout(speak, 250);
    } else {
      speak();
    }
  });
}

export async function playDemoSpeech(input: {
  text: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  onStarted?: () => void;
}): Promise<{ mode: 'server' | 'browser'; profile: DemoVoiceProfile }> {
  const base =
    (input.voiceId && DEMO_VOICE_PROFILES[input.voiceId]) ||
    Object.values(DEMO_VOICE_PROFILES).find((p) => p.label === input.label) ||
    DEMO_VOICE_PROFILES.amara!;

  const profile: DemoVoiceProfile = {
    ...base,
    lang: input.lang ?? base.lang,
    label: input.label ?? base.label,
  };

  const usedServer = await playViaServer(input.text, profile, input.onStarted);
  if (usedServer) return { mode: 'server', profile };

  await playViaBrowser(input.text, profile, input.onStarted);
  return { mode: 'browser', profile };
}
