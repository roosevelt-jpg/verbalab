import { buildLearnBackCorridors, type BuiltLearnBackCorridor } from '../african-markets';

export const LEARNBACK_FEATURE = 'learnBack' as const;
export const LEARNBACK_SCHEMA_VERSION = 'learnback-1.1';
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

export type CorridorCapability = BuiltLearnBackCorridor;

/** Fully wired African-market corridors — pronunciation stays honest when assessor unavailable. */
export const LEARNBACK_CORRIDORS: CorridorCapability[] = buildLearnBackCorridors();

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
