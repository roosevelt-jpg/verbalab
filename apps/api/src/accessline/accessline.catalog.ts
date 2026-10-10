import {
  ACCESSLINE_FEATURE_FLAG,
  ACCESSLINE_PILOT_CORRIDOR,
  ACCESSLINE_POLICY_VERSION,
  ACCESSLINE_SCHEMA_VERSION,
} from './accessline.types';

export function accesslineCatalog() {
  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim(),
  );
  return {
    id: 'accessline',
    name: 'Lugemi AccessLine',
    headline: 'Call in your language. Get grounded delivery answers.',
    description:
      'Native-language telephone service for logistics delivery-status enquiries. Callers use ordinary business numbers — no smartphone app required.',
    schemaVersion: ACCESSLINE_SCHEMA_VERSION,
    policyVersion: ACCESSLINE_POLICY_VERSION,
    featureFlag: ACCESSLINE_FEATURE_FLAG,
    pilot: {
      corridor: ACCESSLINE_PILOT_CORRIDOR,
      scope: 'One logistics business, one jurisdiction, inbound delivery-status (read-only).',
    },
    workflow: [
      'inbound_line_resolve',
      'disclosure',
      'language_selection',
      'intent',
      'registered_customer_auth',
      'order_reference',
      'grounded_delivery_lookup',
      'critical_confirmation',
      'allowlisted_handoff_or_case',
    ],
    deferred: [
      'payment_collection',
      'banking_actions',
      'emergency_triage',
      'autonomous_refunds',
      'address_changes',
      'voice_biometric_auth',
      'continuous_duplex_streaming',
      'interpreted_staff_mode',
    ],
    telephony: {
      provider: 'twilio',
      configured: twilioConfigured,
      mode: twilioConfigured ? 'live_ready_when_authorized' : 'simulated_only',
      note: twilioConfigured
        ? 'Twilio credentials present. Live number purchase, PSTN calls, and external OTP require separate authorization.'
        : 'No Twilio credentials — simulator and labeled fixtures only. Live webhooks return provider_not_configured.',
      media: 'turn_based_speech_dtmf',
      duplexStreaming: false,
    },
    honesty: [
      'Caller ID, spoken name, and order reference never bypass authentication.',
      'Null ETA means unavailable — never invent delivery times.',
      'Fixture/simulator audio and OTP paths are labeled; they are not carrier proof.',
      'Transfer destinations are tenant allowlisted only.',
      'Case references are not bearer credentials on return calls.',
    ],
    docs: '/docs/ACCESSLINE.md',
  };
}
