export const EVERYDAY_FEATURE = 'everyday' as const;
export const EVERYDAY_SCHEMA_VERSION = 'everyday-1.0';
export const EVERYDAY_NOTICE_VERSION = 'everyday-notice-v1';
export const EVERYDAY_POLICY_VERSION = 'everyday_private_v1';

export const EVERYDAY_MODES = ['read_this_to_me', 'help_me_reply', 'explain_this_word'] as const;
export type EverydayMode = (typeof EVERYDAY_MODES)[number];

export const SESSION_STATES = [
  'capturing',
  'reviewing',
  'ready',
  'stale',
  'deleted',
  'failed',
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const ANSWERABILITY = [
  'supported',
  'partially_supported',
  'not_found',
  'unreadable',
  'requires_clarification',
] as const;
export type Answerability = (typeof ANSWERABILITY)[number];

export const DOCUMENT_CATEGORIES = [
  'administrative_notice',
  'utility_bill',
  'school_notice',
  'medical',
  'legal',
  'financial',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const SENSITIVE_CATEGORIES = new Set<DocumentCategory>(['medical', 'legal', 'financial']);

export const EVERYDAY_EVENTS = [
  'document.ready',
  'recapture.required',
  'ocr.ready',
  'translation.ready',
  'explanation.ready',
  'audio.ready',
  'output.stale',
  'reply.approved',
  'processing.failed',
  'session.deleted',
] as const;

export type EverydayBlock = {
  id: string;
  page: number;
  text: string;
  bbox: { x: number; y: number; w: number; h: number; coordinateSystem: 'normalized_0_1' };
  readingOrder: number;
  uncertainty: 'low' | 'medium' | 'high' | 'unreadable';
  kind: 'paragraph' | 'heading' | 'table_cell' | 'footnote' | 'label' | 'value' | 'unknown';
};

export type CorridorCapability = {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  label: string;
  ocr: boolean;
  faithfulTranslation: boolean;
  explanation: boolean;
  groundedQa: boolean;
  tts: boolean;
  reply: boolean;
  note: string;
};

/** Fully wired corridors — each runs the same private pipeline with honest adapter status. */
export const EVERYDAY_CORRIDORS: CorridorCapability[] = [
  {
    id: 'en-ak',
    sourceLanguage: 'en',
    targetLanguage: 'ak',
    label: 'English → Akan/Twi',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Printed notices and bills. Handwriting and unsupported scripts stay explicit failures.',
  },
  {
    id: 'en-ee',
    sourceLanguage: 'en',
    targetLanguage: 'ee',
    label: 'English → Ewe',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Same pipeline as en-ak with Ewe target variety and Echo voice.',
  },
  {
    id: 'en-fr',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    label: 'English → French',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Administrative bilingual corridor.',
  },
  {
    id: 'ak-en',
    sourceLanguage: 'ak',
    targetLanguage: 'en',
    label: 'Akan/Twi → English',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Reverse corridor for replies and explanations into English.',
  },
  {
    id: 'ee-en',
    sourceLanguage: 'ee',
    targetLanguage: 'en',
    label: 'Ewe → English',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Reverse corridor for replies and explanations into English.',
  },
  {
    id: 'fr-en',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
    label: 'French → English',
    ocr: true,
    faithfulTranslation: true,
    explanation: true,
    groundedQa: true,
    tts: true,
    reply: true,
    note: 'Reverse bilingual corridor.',
  },
];

export const ADVICE_DISCLAIMER =
  'This is a plain-language explanation of the supplied document text. It is not medical, legal, or financial advice. Ask a qualified professional when interpretation is consequential or unclear.';

export function everydayMaxUploadBytes(): number {
  const raw = Number(process.env.EVERYDAY_MAX_UPLOAD_BYTES ?? 20 * 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 20 * 1024 * 1024;
}

export function everydayMaxPages(): number {
  const raw = Number(process.env.EVERYDAY_MAX_PAGES ?? 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}
