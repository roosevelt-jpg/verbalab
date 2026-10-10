export const ACCESSLINE_SCHEMA_VERSION = 1;
export const ACCESSLINE_POLICY_VERSION = 'accessline-policy-v1';
export const ACCESSLINE_FEATURE_FLAG = 'accessLine';

export const ACCESSLINE_STATES = [
  'ringing',
  'disclosure',
  'language_selection',
  'unauthenticated',
  'authenticating',
  'assisting',
  'clarifying',
  'handoff_pending',
  'human_connected',
  'ending',
  'ended',
  'failed',
] as const;

export type AccessLineState = (typeof ACCESSLINE_STATES)[number];

export const ACCESSLINE_INTENTS = [
  'delivery_status',
  'opening_hours',
  'repeat',
  'language_switch',
  'human_assistance',
  'unknown',
] as const;

export type AccessLineIntent = (typeof ACCESSLINE_INTENTS)[number];

export type AccessLineCorridor = {
  id: string;
  variety: string;
  label: string;
  dtmf: string;
  asr: 'shipped' | 'simulated';
  tts: 'shipped' | 'simulated';
  nativeReview: 'pending' | 'reviewed';
};

export const ACCESSLINE_PILOT_CORRIDOR: AccessLineCorridor = {
  id: 'ke-logistics-sw-en',
  variety: 'sw-KE',
  label: 'Kenya logistics — Swahili / English',
  dtmf: '1',
  asr: 'simulated',
  tts: 'simulated',
  nativeReview: 'pending',
};

export type DeliveryLookupResult = {
  status: 'dispatched' | 'out_for_delivery' | 'delivered' | 'unknown' | 'not_found';
  updatedAt: string | null;
  estimatedDelivery: string | null;
  source: string;
  resultState: 'fresh' | 'stale' | 'unavailable' | 'timeout' | 'inaccessible';
  orderReference: string;
};

export type RegisteredContact = {
  phoneE164: string;
  customerScope: string;
  /** Simulator-only label; live OTP delivery requires authorized messaging. */
  simulateOtpHint?: string;
};

export type TransferDestination = {
  id: string;
  label: string;
  destination: string;
  hours?: string;
};
