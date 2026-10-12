import { OWN_TTS_VOICES } from '../gateway/own-tts.adapter';
import { ACCENT_IDENTITY_SEEDS } from '../accents/accent-identity-seeds';
import type { PassportEntryType, PassportProduct } from './passport.types';

/**
 * Honest capability matrix: which existing Lugemi model/adapters can consume
 * Passport entry types. Unsupported combinations stay explicit — a profile
 * never manufactures missing model capability.
 */
export type PassportModelCapability = {
  adapter: string;
  models: string[];
  entryTypes: PassportEntryType[];
  products: PassportProduct[];
  consumption:
    | 'glossary_constraints'
    | 'asr_vocabulary_priming'
    | 'pronunciation_alias'
    | 'unit_clarification'
    | 'voice_preference'
    | 'variety_preference';
  notes: string;
  status: 'wired' | 'soft' | 'clarify_only';
};

export function passportModelCapabilities(): PassportModelCapability[] {
  const ownVoiceIds = OWN_TTS_VOICES.map((v) => v.id).filter(Boolean);
  const varietyIds = ACCENT_IDENTITY_SEEDS.map((s) => s.id).filter(Boolean);
  const speechVarieties = [
    ...new Set(
      ACCENT_IDENTITY_SEEDS.map((s) => s.speechVariety).filter(
        (v): v is string => typeof v === 'string' && v.length > 0,
      ),
    ),
  ];

  return [
    {
      adapter: 'TerminologyProvider',
      models: ['lugemi_mt', 'baobab_mt', 'glossary_apply'],
      entryTypes: ['terminology_meaning', 'approved_translation', 'preferred_name'],
      products: ['translate', 'everyday', 'dealbridge', 'language_assurance', 'voicebridge'],
      consumption: 'glossary_constraints',
      notes:
        'Applied through structured glossary protect/restore on MT paths. Soft enforce — not constrained decoding.',
      status: 'wired',
    },
    {
      adapter: 'PronunciationProvider',
      models: ['own_tts', 'neural_tts', 'voice_studio_lexemes', ...ownVoiceIds.slice(0, 8)],
      entryTypes: ['pronunciation'],
      products: ['voice_studio', 'neural_tts', 'voicebridge', 'learnback'],
      consumption: 'pronunciation_alias',
      notes:
        'Aliases sync into Voice Studio lexemes / synthesis hints when the selected voice supports grapheme aliases. IPA/SSML only when the target engine advertises support.',
      status: 'wired',
    },
    {
      adapter: 'AsrVocabularyProvider',
      models: ['lugemi_asr', 'whisper_prompt'],
      entryTypes: ['terminology_meaning', 'preferred_name', 'pronunciation'],
      products: ['speech_recognition', 'meetingbridge', 'accessline', 'voicebridge'],
      consumption: 'asr_vocabulary_priming',
      notes: 'Soft ASR prompt priming via SpeechVocabularyTerm — never silent weight training.',
      status: 'soft',
    },
    {
      adapter: 'UnitClarifier',
      models: ['dealbridge_term_candidates', 'atlas_clarify'],
      entryTypes: ['local_unit_definition'],
      products: ['dealbridge', 'everyday', 'relay'],
      consumption: 'unit_clarification',
      notes:
        'Surfaces package/unit meaning for clarification. Never auto-approves price, quantity ordered, or business obligation.',
      status: 'clarify_only',
    },
    {
      adapter: 'VarietyPreference',
      models: ['accent_identity', ...speechVarieties.slice(0, 12)],
      entryTypes: ['preference'],
      products: ['neural_tts', 'voice_studio', 'voicebridge', 'learnback'],
      consumption: 'variety_preference',
      notes: `Validated against Accent Identity catalog (${varietyIds.length} packs). Preferences are independent of nationality.`,
      status: 'wired',
    },
    {
      adapter: 'VoicePreference',
      models: ['own_tts', ...ownVoiceIds.slice(0, 12)],
      entryTypes: ['preference'],
      products: ['neural_tts', 'voice_studio', 'everyday', 'learnback'],
      consumption: 'voice_preference',
      notes: `Listening/synthesis voice prefs validated against OWN TTS registry (${ownVoiceIds.length} voices).`,
      status: 'wired',
    },
  ];
}

export function entryTypesSupportedForProduct(product: string): PassportEntryType[] {
  const set = new Set<PassportEntryType>();
  for (const cap of passportModelCapabilities()) {
    if (cap.products.includes(product as PassportProduct)) {
      for (const t of cap.entryTypes) set.add(t);
    }
  }
  return [...set];
}

export function isKnownVariety(variety: string): boolean {
  const v = variety.trim().toLowerCase();
  if (!v) return false;
  if (v === 'any') return true;
  return ACCENT_IDENTITY_SEEDS.some((s) => {
    const id = s.id?.toLowerCase?.() ?? '';
    const speech = s.speechVariety?.toLowerCase?.() ?? '';
    const lang = s.languageCode?.toLowerCase?.() ?? '';
    return id === v || speech === v || lang === v;
  });
}

export function isKnownVoiceId(voiceId: string): boolean {
  const id = voiceId.trim().toLowerCase();
  if (!id) return false;
  return OWN_TTS_VOICES.some((v) => (v.id?.toLowerCase?.() ?? '') === id);
}

export function passportModelSyncSummary() {
  const caps = passportModelCapabilities();
  return {
    resolverVersion: 'passport_resolver_v1',
    accentIdentityPacks: ACCENT_IDENTITY_SEEDS.length,
    ownTtsVoices: OWN_TTS_VOICES.length,
    adapters: caps.map((c) => ({
      adapter: c.adapter,
      status: c.status,
      entryTypes: c.entryTypes,
      products: c.products,
      models: c.models.slice(0, 16),
      notes: c.notes,
    })),
    honesty: [
      'Passport memory never fine-tunes shared model weights.',
      'Unsupported varieties/voices remain explicit rejects — profiles cannot invent capability.',
      'Caller ID / phone identity cannot retrieve a private Passport.',
      'Training consent is separate from storage, application, and sharing.',
    ],
  };
}
