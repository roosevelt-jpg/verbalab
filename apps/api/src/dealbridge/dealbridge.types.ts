export const DEALBRIDGE_NOTICE_VERSION = 'dealbridge-notice-v1';
export const DEALBRIDGE_SCHEMA_VERSION = '1.0';
export const DEALBRIDGE_EXTRACTOR_VERSION = 'dealbridge-extractor-v1';
export const DEALBRIDGE_VERIFIER_VERSION = 'dealbridge-verifier-v1';
export const DEALBRIDGE_FEATURE = 'dealBridge' as const;

export const DEAL_STATES = [
  'draft',
  'invited',
  'active',
  'reviewing',
  'clarifying',
  'awaiting_confirmations',
  'issued',
  'declined',
  'cancelled',
  'expired',
] as const;

export type DealState = (typeof DEAL_STATES)[number];

export const CHECK_STATES = [
  'not_assessed',
  'needs_clarification',
  'check_completed',
  'human_review_required',
] as const;

export type CheckState = (typeof CHECK_STATES)[number];

export const CONSENT_PURPOSES = ['processing', 'recording', 'retention', 'training'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const SESSION_EVENT_TYPES = [
  'turn.received',
  'transcript.ready',
  'translation.ready',
  'terms.proposed',
  'clarification.required',
  'review.ready',
  'confirmation.recorded',
  'receipt.issued',
  'session.expired',
  'processing.failed',
] as const;

export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number];

export const PILOT_EVENT_TYPES = [
  'pilot.enrolled',
  'deal.started',
  'review.presented',
  'check.completed',
  'clarification.opened',
  'clarification.resolved',
  'deal.confirmed',
  'receipt.issued',
  'deal.abandoned',
  'outcome.reported',
  'usage.cost_recorded',
] as const;

export type PilotEventType = (typeof PILOT_EVENT_TYPES)[number];

export type NormalizedTerms = {
  schemaVersion: string;
  product: { description: string | null; grade: string | null };
  quantity: {
    value: string | null;
    unit: string | null;
    packageSize: { value: string | null; unit: string | null };
  };
  pricing: {
    currency: string | null;
    unitPrice: string | null;
    total: string | null;
    basis: string | null;
    taxTreatment: string | null;
    shippingIncluded: boolean | null;
  };
  delivery: {
    date: string | null;
    timeZone: string | null;
    location: string | null;
    locationConfirmed: boolean;
  };
  payment: {
    method: string | null;
    dueCondition: string | null;
    deposit: string | null;
  };
  unresolvedFields: string[];
};

export const REQUIRED_FIELDS_BY_CATEGORY: Record<string, string[]> = {
  wholesale_rice: [
    'product.description',
    'quantity.value',
    'quantity.unit',
    'pricing.currency',
    'pricing.unitPrice',
    'pricing.total',
    'delivery.date',
    'delivery.location',
    'payment.dueCondition',
  ],
};

export const SUPPORTED_CURRENCIES = ['GHS', 'XOF', 'USD', 'EUR', 'NGN', 'KES'] as const;
export const SUPPORTED_UNITS = ['bag', 'kg', 'ton', 'crate', 'sack'] as const;

export type CorridorCapability = {
  id: string;
  merchantLanguage: string;
  buyerLanguage: string;
  category: string;
  asr: boolean;
  translation: boolean;
  tts: boolean;
  label: string;
  note: string;
};

export const DEALBRIDGE_CORRIDORS: CorridorCapability[] = [
  {
    id: 'en-fr',
    merchantLanguage: 'en',
    buyerLanguage: 'fr',
    category: 'wholesale_rice',
    asr: true,
    translation: true,
    tts: true,
    label: 'English ↔ French (wholesale rice pilot)',
    note: 'Pilot corridor. Coverage is task-specific; unsupported combinations return capability errors.',
  },
  {
    id: 'ak-fr',
    merchantLanguage: 'ak',
    buyerLanguage: 'fr',
    category: 'wholesale_rice',
    asr: false,
    translation: true,
    tts: false,
    label: 'Twi/Akan ↔ French (illustrative; ASR/TTS gated)',
    note: 'Illustrative corridor from the product brief. ASR and spoken receipt replay are not asserted as production-ready.',
  },
];
