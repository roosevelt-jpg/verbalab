export const LEARNBACK_FEATURE = 'learnBack' as const;
export const LEARNBACK_SCHEMA_VERSION = 'learnback-1.0';
export const LEARNBACK_NOTICE_VERSION = 'learnback-notice-v1';
export const LEARNBACK_POLICY_VERSION = 'learnback_private_v1';
export const LEARNBACK_RUBRIC_INTERVIEW_V1 = 'interview_v1';

export const SESSION_STATES = [
  'ready',
  'recording',
  'processing',
  'feedback_available',
  'completed',
  'deleted',
  'failed',
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const ATTEMPT_STATES = [
  'uploaded',
  'transcribing',
  'transcript_ready',
  'evaluating',
  'feedback_available',
  'superseded',
  'failed',
] as const;

export const SITUATIONS = [
  'job_interview',
  'customer_service',
  'school_meeting',
  'workplace_conversation',
] as const;
export type Situation = (typeof SITUATIONS)[number];

export const EVAL_DIMENSIONS = [
  'relevance',
  'completeness',
  'organization',
  'grammar',
  'pronunciation',
] as const;
export type EvalDimension = (typeof EVAL_DIMENSIONS)[number];

export type CorridorCapability = {
  id: string;
  explanationLanguage: string;
  practiceLanguage: string;
  label: string;
  situations: Situation[];
  tts: boolean;
  asr: boolean;
  pronunciation: boolean;
  note: string;
};

/** Fully wired corridors — pronunciation stays honest when assessor unavailable. */
export const LEARNBACK_CORRIDORS: CorridorCapability[] = [
  {
    id: 'ak-en-interview',
    explanationLanguage: 'ak',
    practiceLanguage: 'en',
    label: 'Twi/Akan explanations · English interview practice',
    situations: ['job_interview'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Adult interview practice. Pronunciation stays not_assessed until a validated English assessor is enabled (LEARNBACK_PRONUNCIATION=1). Ghanaian English is not marked wrong for non-US/UK accent.',
  },
  {
    id: 'en-ak-interview',
    explanationLanguage: 'en',
    practiceLanguage: 'ak',
    label: 'English explanations · Akan/Twi interview practice',
    situations: ['job_interview'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Practice answers in Akan/Twi with English feedback. Pronunciation not_assessed without a validated Akan assessor.',
  },
  {
    id: 'en-fr-interview',
    explanationLanguage: 'en',
    practiceLanguage: 'fr',
    label: 'English explanations · French interview practice',
    situations: ['job_interview', 'workplace_conversation'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Bilingual interview corridor. Pronunciation gated.',
  },
  {
    id: 'fr-en-interview',
    explanationLanguage: 'fr',
    practiceLanguage: 'en',
    label: 'French explanations · English interview practice',
    situations: ['job_interview', 'workplace_conversation'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Bilingual interview corridor. Pronunciation gated.',
  },
  {
    id: 'ak-en-customer',
    explanationLanguage: 'ak',
    practiceLanguage: 'en',
    label: 'Twi/Akan explanations · English customer service',
    situations: ['customer_service'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'Customer-service scenarios with the same privacy and evaluation contracts.',
  },
  {
    id: 'en-ak-school',
    explanationLanguage: 'en',
    practiceLanguage: 'ak',
    label: 'English explanations · Akan/Twi school meeting',
    situations: ['school_meeting'],
    tts: true,
    asr: true,
    pronunciation: false,
    note: 'School-meeting practice; not professional advice for educators or parents.',
  },
];

export function learnbackMaxAudioBytes(): number {
  const raw = Number(process.env.LEARNBACK_MAX_AUDIO_BYTES ?? 15 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 15 * 1024 * 1024;
}

export function learnbackMaxAudioSeconds(): number {
  const raw = Number(process.env.LEARNBACK_MAX_AUDIO_SECONDS ?? 120);
  return Number.isFinite(raw) && raw > 0 ? raw : 120;
}

export function pronunciationEnabled(): boolean {
  return process.env.LEARNBACK_PRONUNCIATION === '1';
}
