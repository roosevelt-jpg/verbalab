import { OWN_TTS_VOICES } from '../gateway/own-tts.adapter';
import {
  capabilityForVoice,
  FORMANT_ONLY_WITHOUT_NEURAL,
  isDemoSafeVoice,
  type VerificationStatus,
} from '../gateway/voice-capability-registry';
import { DEMO_CATALOGUE } from '../demo-speech/demo-catalogue';
import { ACCENT_IDENTITY_SEEDS } from '../accents/accent-identity-seeds';
import { NSE_RESOLVER_VERSION, type NseCapabilityStatus, type NseTask } from './nse.types';

function primaryLang(locale: string): string {
  return locale.split('-')[0] || 'und';
}

export type NseCapabilityEntry = {
  task: NseTask;
  voiceId: string;
  language: string;
  locale: string;
  varietyLabel: string;
  regionalLabel: string;
  status: NseCapabilityStatus;
  localEngine: string;
  verificationStatus: VerificationStatus;
  phonemeSupport: boolean;
  ssmlSupport: boolean;
  contextProsody: boolean;
  outputCodecs: string[];
  sampleRateHz: number[];
  demoSafe: boolean;
  limits: string[];
  notes: string;
};

function mapVerificationToStatus(
  verification: VerificationStatus,
  demoSafe: boolean,
  neuralLive: boolean,
): NseCapabilityStatus {
  if (verification === 'unsupported' || verification === 'formant_placeholder') {
    return demoSafe ? 'limited' : 'unavailable';
  }
  if (verification === 'native_reviewed') return 'approved_for_task';
  if (verification === 'neural_unreviewed' && neuralLive) return 'native_review_pending';
  if (verification === 'espeak_demo') return 'technically_verified';
  if (verification === 'neural_unreviewed') return 'configured';
  return 'configured';
}

/** Build task/variety capability manifest from live OWN TTS + demo catalogue. */
export function buildNseCapabilities(liveVoices: Array<{
  id: string;
  status?: string;
  synthEngine?: string | null;
  verificationStatus?: string | null;
  languages?: string[];
  locale?: string;
}>): {
  engineVersion: string;
  tasks: NseTask[];
  honesty: string[];
  formantOnlyWithoutNeural: string[];
  demoCatalogueCount: number;
  accentIdentityPacks: number;
  capabilities: NseCapabilityEntry[];
} {
  const liveById = new Map(liveVoices.map((v) => [v.id, v]));
  const entries: NseCapabilityEntry[] = [];

  for (const voice of OWN_TTS_VOICES) {
    const live = liveById.get(voice.id);
    const neuralLive =
      live?.verificationStatus === 'neural_unreviewed' ||
      live?.verificationStatus === 'native_reviewed' ||
      live?.synthEngine === 'neural_kokoro' ||
      live?.synthEngine === 'neural_piper' ||
      live?.status === 'live';
    const locale = voice.locale || voice.languages[0] || 'en';
    const cap = capabilityForVoice({
      voiceId: voice.id,
      locale,
      neuralLive,
    });
    const demoSafe = isDemoSafeVoice(voice.id, locale);
    const status = mapVerificationToStatus(cap.verificationStatus, demoSafe, neuralLive);
    const pack = ACCENT_IDENTITY_SEEDS.find(
      (s) => s.echoVoiceId === voice.id || s.languageCode === (voice.languages[0] ?? ''),
    );

    entries.push({
      task: 'text_to_speech',
      voiceId: voice.id,
      language: voice.languages[0] ?? locale.split('-')[0]!,
      locale,
      varietyLabel: pack?.speechVariety || pack?.culturalIdentity || voice.name,
      regionalLabel: pack?.regionTags?.join(', ') || locale,
      status,
      localEngine: live?.synthEngine || cap.localEngine,
      verificationStatus: (live?.verificationStatus as VerificationStatus) || cap.verificationStatus,
      phonemeSupport: false, // honest: no universal IPA path today
      ssmlSupport: false, // SSML lite is soft text hints only
      contextProsody: true, // sentence punctuation / eSpeak tables
      outputCodecs: ['audio/mpeg', 'audio/wav'],
      sampleRateHz: [22050, 24000],
      demoSafe,
      limits: [
        ...(FORMANT_ONLY_WITHOUT_NEURAL.has((voice.languages[0] ?? primaryLang(locale)).split('-')[0]!)
          ? ['Native L1 weights not live — customer demos remap to cultural English/French']
          : []),
        'Nationality is not a voice selector',
        'Technical decode ≠ native-quality approval',
      ],
      notes: cap.limitations || voice.name,
    });
  }

  // ASR / translation tasks — capability is corridor-level, not per-voice.
  const asrLanguages = [...new Set(OWN_TTS_VOICES.flatMap((v) => v.languages))];
  for (const lang of asrLanguages.slice(0, 40)) {
    entries.push({
      task: 'speech_to_text',
      voiceId: 'n/a',
      language: lang,
      locale: lang,
      varietyLabel: lang,
      regionalLabel: lang,
      status: 'technically_verified',
      localEngine: 'lugemi_asr',
      verificationStatus: 'neural_unreviewed',
      phonemeSupport: false,
      ssmlSupport: false,
      contextProsody: false,
      outputCodecs: ['application/json'],
      sampleRateHz: [16000],
      demoSafe: true,
      limits: [
        'Dialect/accent cues are not acoustic phonetics ID',
        'Low ASR confidence is never a speaker-competence judgment',
      ],
      notes: 'Whisper / Lugemi ASR — dialect detection is separate and advisory.',
    });
  }

  return {
    engineVersion: NSE_RESOLVER_VERSION,
    tasks: ['text_to_speech', 'speech_to_text', 'text_translation', 'speech_translation'],
    honesty: [
      'Source recognition and target synthesis are independent — source accent is not copied into target by default.',
      'Translation support is not TTS support.',
      'Formant placeholders never pass customer-facing demos.',
      'Native review is required before approved_for_task; ASR back-transcription alone cannot certify tone.',
      'Fine-tuning never auto-ingests private speech or reviewer notes.',
      `streaming_interpretation is listed but requires additional lifecycle tests — status limited.`,
    ],
    formantOnlyWithoutNeural: [...FORMANT_ONLY_WITHOUT_NEURAL],
    demoCatalogueCount: DEMO_CATALOGUE.length,
    accentIdentityPacks: ACCENT_IDENTITY_SEEDS.length,
    capabilities: entries,
  };
}

export function assertTaskAuthorized(
  capabilities: NseCapabilityEntry[],
  task: NseTask,
  voiceId?: string,
  language?: string,
): NseCapabilityEntry | null {
  if (task === 'streaming_interpretation') return null;
  const pool = capabilities.filter((c) => c.task === task);
  if (voiceId) {
    const hit = pool.find((c) => c.voiceId === voiceId && c.status !== 'unavailable' && c.status !== 'suspended');
    if (hit) return hit;
  }
  if (language) {
    const lang = language.toLowerCase();
    return (
      pool.find(
        (c) =>
          (c.language.toLowerCase() === lang || c.locale.toLowerCase().startsWith(lang)) &&
          c.status !== 'unavailable' &&
          c.status !== 'suspended',
      ) ?? null
    );
  }
  return null;
}
