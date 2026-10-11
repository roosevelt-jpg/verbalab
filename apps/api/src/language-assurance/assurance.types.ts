export const LANGUAGE_ASSURANCE_FEATURE = 'languageAssurance' as const;
export const LANGUAGE_ASSURANCE_SCHEMA_VERSION = 'language-assurance-1.0';
export const LANGUAGE_ASSURANCE_NOTICE_VERSION = 'language-assurance-notice-v1';
export const LANGUAGE_ASSURANCE_CALIBRATION_VERSION = 'assurance-cal-unmeasured-v1';

export const EXECUTION_STATES = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'stale',
] as const;
export type ExecutionState = (typeof EXECUTION_STATES)[number];

export const DISPOSITIONS = [
  'eligible_under_policy',
  'needs_clarification',
  'human_review_required',
  'blocked',
  'indeterminate',
] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

export const CHECK_STAGES = [
  'structural_audio_integrity',
  'critical_information',
  'semantic_fidelity',
  'spoken_realization',
  'native_review',
] as const;
export type CheckStage = (typeof CHECK_STAGES)[number];

export const PRODUCTS = [
  'voice_studio',
  'voicebridge',
  'dealbridge',
  'accessline',
  'meetingbridge',
  'generic',
] as const;
export type AssuranceProduct = (typeof PRODUCTS)[number];

export const CONTENT_CATEGORIES = [
  'business_announcement',
  'logistics_instruction',
  'commercial_terms',
  'preview',
  'meeting_action',
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export type CorridorCapability = {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  label: string;
  criticalChecks: boolean;
  fidelity: boolean;
  spokenAsr: boolean;
  note: string;
};

/** Pilot corridor: English ↔ Akan/Twi business announcements. */
export const ASSURANCE_CORRIDORS: CorridorCapability[] = [
  {
    id: 'en-ak',
    sourceLanguage: 'en',
    targetLanguage: 'ak',
    label: 'English ↔ Akan/Twi (Ghana) — business announcements',
    criticalChecks: true,
    fidelity: true,
    spokenAsr: false,
    note: 'Primary pilot. Critical-field and Fidelity checks run. Independent Akan ASR for spoken realization stays gated until measured (LANGUAGE_ASSURANCE_SPOKEN_ASR=1).',
  },
  {
    id: 'en-fr',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    label: 'English ↔ French — logistics',
    criticalChecks: true,
    fidelity: true,
    spokenAsr: true,
    note: 'Secondary corridor for bilingual logistics copy.',
  },
];

export const SYSTEM_POLICY_BUSINESS_AUDIO = {
  version: 'business_audio_v1',
  task: 'business_batch_audio',
  contentCategory: 'business_announcement' as ContentCategory,
  requiredStages: [
    'structural_audio_integrity',
    'critical_information',
    'semantic_fidelity',
    'spoken_realization',
    'native_review',
  ] as CheckStage[],
  requireNativeReview: true,
  allowOverrides: false,
  maxRetries: 1,
  budgetNote: 'Async batch only — not a live call guarantee.',
};

export const SYSTEM_POLICY_PREVIEW = {
  version: 'preview_unreviewed_v1',
  task: 'preview',
  contentCategory: 'preview' as ContentCategory,
  requiredStages: ['critical_information', 'semantic_fidelity'] as CheckStage[],
  requireNativeReview: false,
  allowOverrides: false,
  maxRetries: 0,
  budgetNote: 'Preview may be generated but must stay labeled unreviewed.',
};
