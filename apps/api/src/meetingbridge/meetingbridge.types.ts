export const MEETINGBRIDGE_NOTICE_VERSION = 'meetingbridge-notice-v1';
export const MEETINGBRIDGE_FEATURE = 'meetingBridge' as const;
export const MEETINGBRIDGE_MAX_PARTICIPANTS = 6;
export const MEETINGBRIDGE_SCHEMA_VERSION = 'meetingbridge-1.0';

export const MEETING_STATES = [
  'scheduled',
  'lobby',
  'live',
  'processing',
  'reviewing',
  'minutes_issued',
  'cancelled',
] as const;
export type MeetingState = (typeof MEETING_STATES)[number];

export const ITEM_STATES = [
  'proposed',
  'reviewing',
  'clarification_required',
  'partially_confirmed',
  'confirmed',
  'declined',
  'disputed',
  'superseded',
  'cancelled',
] as const;
export type ItemState = (typeof ITEM_STATES)[number];

export const ITEM_KINDS = ['decision', 'action', 'proposal', 'question'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const CONFIRM_ACTIONS = ['confirm', 'change_request', 'decline'] as const;
export type ConfirmAction = (typeof CONFIRM_ACTIONS)[number];

export const CONSENT_PURPOSES = ['processing', 'recording', 'retention', 'training'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const LISTENING_MODES = ['original', 'translated', 'captions_only'] as const;
export type ListeningMode = (typeof LISTENING_MODES)[number];

export const MEETING_EVENT_TYPES = [
  'participant.joined',
  'participant.left',
  'transcript.provisional',
  'transcript.committed',
  'transcript.corrected',
  'translation.ready',
  'translation.repaired',
  'item.proposed',
  'item.stale',
  'item.confirmed',
  'item.disputed',
  'minutes.ready',
  'minutes.issued',
  'meeting.closed',
  'integration.failed',
] as const;
export type MeetingEventType = (typeof MEETING_EVENT_TYPES)[number];

export type CorridorCapability = {
  id: string;
  speakingLanguage: string;
  listeningLanguage: string;
  asr: boolean;
  translation: boolean;
  tts: boolean;
  label: string;
  note: string;
};

/**
 * Meeting corridors. Ghana listen-channel TTS uses dedicated Echo pack voices.
 * Neural ASR for Akan/Ewe majors remains gated by MEETINGBRIDGE_GHANA_ASR=1.
 */
export const MEETINGBRIDGE_CORRIDORS: CorridorCapability[] = [
  {
    id: 'en-ak',
    speakingLanguage: 'en',
    listeningLanguage: 'ak',
    asr: true,
    translation: true,
    tts: true,
    label: 'English ↔ Akan/Twi (Ghana)',
    note: 'Primary corridor. Captions + translation wired. Echo voice own:ak-gh-female for listen-channel TTS. Akan ASR gated by MEETINGBRIDGE_GHANA_ASR=1 until measured.',
  },
  {
    id: 'en-ee',
    speakingLanguage: 'en',
    listeningLanguage: 'ee',
    asr: false,
    translation: true,
    tts: true,
    label: 'English ↔ Ewe (Ghana)',
    note: 'Translation corridor with Echo voice own:ee-gh-female. ASR gated by MEETINGBRIDGE_GHANA_ASR=1.',
  },
  {
    id: 'en-gaa',
    speakingLanguage: 'en',
    listeningLanguage: 'gaa',
    asr: false,
    translation: true,
    tts: true,
    label: 'English ↔ Ga (Ghana)',
    note: 'Ga corridor with Echo voice own:gaa-gh-female. ASR gated until measured.',
  },
  {
    id: 'en-dag',
    speakingLanguage: 'en',
    listeningLanguage: 'dag',
    asr: false,
    translation: true,
    tts: true,
    label: 'English ↔ Dagbani (Ghana)',
    note: 'Dagbani corridor with Echo voice own:dag-gh-male. ASR gated until measured.',
  },
  {
    id: 'en-fr',
    speakingLanguage: 'en',
    listeningLanguage: 'fr',
    asr: true,
    translation: true,
    tts: true,
    label: 'English ↔ French',
    note: 'Secondary corridor for bilingual logistics coordination.',
  },
];

export const DEFAULT_APPROVAL_POLICY = {
  actionsRequire: 'owners_plus_organizer' as const,
  decisionsRequire: 'authority_plus_affected' as const,
  silenceIsNotConsent: true,
  presenceIsNotConsent: true,
  aiSummaryIsNotConsent: true,
};
