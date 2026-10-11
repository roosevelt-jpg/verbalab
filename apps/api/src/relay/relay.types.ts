import {
  buildRelayCorridors,
  quoteRateForCurrency,
  type BuiltRelayCorridor,
} from '../african-markets';

export const RELAY_FEATURE = 'relay' as const;
export const RELAY_SCHEMA_VERSION = 'relay-1.1';
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

export type RelayCorridor = BuiltRelayCorridor;

/** All wired African-market general-business corridors (Ghana historical ids preserved). */
export const RELAY_CORRIDORS: RelayCorridor[] = buildRelayCorridors();

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

/** Pinned quote in the corridor's market currency (ISO minor units). */
export function defaultQuoteMinor(
  durationMinutes: number,
  currencyCode = 'GHS',
): {
  currency: string;
  amountMinor: number;
  minimumMinutes: number;
  includedMinutes: number;
  overrunCeilingMinor: number;
  taxesFeesMinor: number;
} {
  const included = Math.max(30, durationMinutes);
  const blocks = Math.ceil(included / 15);
  const perBlock = quoteRateForCurrency(currencyCode);
  const amountMinor = blocks * perBlock;
  return {
    currency: currencyCode,
    amountMinor,
    minimumMinutes: 30,
    includedMinutes: included,
    overrunCeilingMinor: amountMinor + perBlock * 2,
    taxesFeesMinor: 0,
  };
}
