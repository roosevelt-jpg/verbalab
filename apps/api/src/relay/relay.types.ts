export const RELAY_FEATURE = 'relay' as const;
export const RELAY_SCHEMA_VERSION = 'relay-1.0';
export const RELAY_POLICY_VERSION = 'relay_private_v1';
export const RELAY_NOTICE_VERSION = 'relay-notice-v1';

export const REQUEST_STATES = [
  'requested',
  'seeking_match',
  'offer_pending',
  'awaiting_user_acceptance',
  'awaiting_payment',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'expired',
  'no_show',
  'disputed',
  'unmatched',
] as const;
export type RequestState = (typeof REQUEST_STATES)[number];

export const BOOKING_STATES = [
  'awaiting_payment',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'expired',
  'no_show',
  'disputed',
] as const;

/** Launch domains — regulated work stays disabled until separate credential review. */
export const RELAY_DOMAINS = ['general_business'] as const;
export const DISABLED_DOMAINS = ['medical', 'legal', 'emergency'] as const;

export type RelayCorridor = {
  id: string;
  label: string;
  sourceLanguage: string;
  targetLanguage: string;
  jurisdiction: string;
  timezone: string;
  domain: (typeof RELAY_DOMAINS)[number];
  delivery: 'browser_audio';
  telephoneBridging: false;
  note: string;
};

export const RELAY_CORRIDORS: RelayCorridor[] = [
  {
    id: 'ak-en-business',
    label: 'Akan/Twi ↔ English · general business (Ghana)',
    sourceLanguage: 'ak',
    targetLanguage: 'en',
    jurisdiction: 'GH',
    timezone: 'Africa/Accra',
    domain: 'general_business',
    delivery: 'browser_audio',
    telephoneBridging: false,
    note: 'Scheduled browser sessions only. Instant staffing and telephone bridging stay disabled until real adapters and supply exist.',
  },
  {
    id: 'en-ak-business',
    label: 'English ↔ Akan/Twi · general business (Ghana)',
    sourceLanguage: 'en',
    targetLanguage: 'ak',
    jurisdiction: 'GH',
    timezone: 'Africa/Accra',
    domain: 'general_business',
    delivery: 'browser_audio',
    telephoneBridging: false,
    note: 'Scheduled browser sessions only. Not an emergency or regulated-domain service.',
  },
];

export function relayOfferTtlMs(): number {
  const raw = Number(process.env.RELAY_OFFER_TTL_MS ?? 15 * 60 * 1000);
  return Number.isFinite(raw) && raw > 0 ? raw : 15 * 60 * 1000;
}

export function relaySetupBufferMinutes(): number {
  const raw = Number(process.env.RELAY_SETUP_BUFFER_MINUTES ?? 5);
  return Number.isFinite(raw) && raw >= 0 ? raw : 5;
}

export function demoInterpretersAllowed(): boolean {
  return (
    process.env.RELAY_ALLOW_DEMO_INTERPRETERS === '1' ||
    process.env.NODE_ENV === 'test' ||
    process.env.RELAY_OPEN === '1'
  );
}

/** Default quote: GHS 180.00 for 30 minutes included. */
export function defaultQuoteMinor(durationMinutes: number): {
  amountMinor: number;
  minimumMinutes: number;
  includedMinutes: number;
  overrunCeilingMinor: number;
  taxesFeesMinor: number;
} {
  const included = Math.max(30, durationMinutes);
  const blocks = Math.ceil(included / 15);
  const amountMinor = blocks * 9000; // GHS 90.00 per 15 min
  return {
    amountMinor,
    minimumMinutes: 30,
    includedMinutes: included,
    overrunCeilingMinor: amountMinor + 18000,
    taxesFeesMinor: 0,
  };
}
