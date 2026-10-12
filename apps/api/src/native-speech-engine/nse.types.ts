export const NSE_RESOLVER_VERSION = 'native_speech_engine_v1';

export const NSE_TASKS = [
  'text_to_speech',
  'speech_to_text',
  'text_translation',
  'speech_translation',
  'streaming_interpretation',
] as const;

export type NseTask = (typeof NSE_TASKS)[number];

export const NSE_CAPABILITY_STATUSES = [
  'configured',
  'technically_verified',
  'native_review_pending',
  'approved_for_task',
  'limited',
  'unavailable',
  'suspended',
] as const;

export type NseCapabilityStatus = (typeof NSE_CAPABILITY_STATUSES)[number];

export type NseProsodySettings = {
  /** Only applied when the synthesizer reports support. */
  rate?: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
  pitch?: 'x-low' | 'low' | 'medium' | 'high' | 'x-high';
  /** Soft emphasis via punctuation/context — never invents emotion. */
  emphasis?: boolean;
};

export type NseDiagnosisIssue = {
  layer:
    | 'weights'
    | 'inference'
    | 'payload'
    | 'codec'
    | 'cache'
    | 'playback'
    | 'capability'
    | 'prosody';
  code: string;
  severity: 'critical' | 'major' | 'minor';
  message: string;
  remediation: string;
};

export type NseProvenance = {
  engineVersion: string;
  recognizerVersion?: string;
  translatorVersion?: string;
  synthesizerVersion?: string;
  tokenizerVersion?: string;
  decoderVersion?: string;
  voiceId?: string;
  languageVariety?: string;
  synthEngine?: string | null;
  verificationStatus?: string | null;
  remapped?: boolean;
  remapNote?: string | null;
  dictionarySnapshotId?: string | null;
  pronunciationApplied?: number;
};
