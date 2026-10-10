export const VOICEBRIDGE_NOTICE_VERSION = 'voicebridge-notice-v1';
export const VOICEBRIDGE_FEATURE = 'voiceBridge' as const;
export const VOICEBRIDGE_MAX_PARTICIPANTS = 10;
export const VOICEBRIDGE_MAX_RECORDING_SECONDS = 5 * 60;
export const VOICEBRIDGE_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const MESSAGE_STATES = [
  'draft',
  'uploading',
  'transcribing',
  'awaiting_review',
  'published',
  'withdrawn',
  'deleted',
] as const;
export type MessageState = (typeof MESSAGE_STATES)[number];

export const VARIANT_STATES = [
  'queued',
  'translating',
  'verifying',
  'text_ready',
  'synthesizing',
  'ready',
  'needs_clarification',
  'failed',
  'unsupported',
] as const;
export type VariantState = (typeof VARIANT_STATES)[number];

export const THREAD_EVENT_TYPES = [
  'message.published',
  'variant.text_ready',
  'variant.audio_ready',
  'message.corrected',
  'variant.superseded',
  'clarification.required',
  'processing.failed',
  'membership.changed',
  'deal_draft.stale',
] as const;
export type ThreadEventType = (typeof THREAD_EVENT_TYPES)[number];

export const CONSENT_PURPOSES = ['processing', 'recording', 'retention', 'training'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
