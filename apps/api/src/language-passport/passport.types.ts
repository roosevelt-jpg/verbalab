export const PASSPORT_SCHEMA_VERSION = 'lugemi.language_passport.v1';
export const PASSPORT_RESOLVER_VERSION = 'passport_resolver_v1';

export const PASSPORT_ENTRY_TYPES = [
  'terminology_meaning',
  'approved_translation',
  'pronunciation',
  'local_unit_definition',
  'preferred_name',
  'preference',
] as const;

export type PassportEntryType = (typeof PASSPORT_ENTRY_TYPES)[number];

export const PASSPORT_PRODUCTS = [
  'translate',
  'voicebridge',
  'voice_studio',
  'accessline',
  'meetingbridge',
  'everyday',
  'dealbridge',
  'relay',
  'learnback',
  'language_assurance',
  'speech_recognition',
  'neural_tts',
] as const;

export type PassportProduct = (typeof PASSPORT_PRODUCTS)[number];

export type ContextScope = {
  category?: string;
  product?: string;
  unit?: string;
  businessScopeId?: string;
  projectId?: string;
  validFrom?: string;
  validUntil?: string;
  authorizedResources?: string[];
};

export type ApprovedMeaning =
  | { kind: 'text'; value: string }
  | { kind: 'translation'; value: string; targetLang: string }
  | {
      kind: 'unit';
      packageCount: string;
      packageSize: string;
      unit: string;
    }
  | { kind: 'pronunciation'; alias: string; ipa?: string; phonemes?: string }
  | { kind: 'preference'; key: string; value: string | boolean | number }
  | Record<string, unknown>;

export type PassportActor = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string;
  ip?: string;
};

export type ResolveRequest = {
  product: PassportProduct | string;
  text: string;
  sourceLang?: string;
  targetLang?: string;
  languageVariety?: string;
  context?: ContextScope;
  /** Explicit current-task overrides (never silently overwritten by memory). */
  taskOverrides?: Array<{ sourceForm: string; approvedValue: unknown }>;
  grantId?: string;
  requestKey?: string;
  pinSnapshot?: boolean;
};
