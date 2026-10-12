import {
  ASSURANCE_CORRIDORS,
  LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
  LANGUAGE_ASSURANCE_FEATURE,
  LANGUAGE_ASSURANCE_NOTICE_VERSION,
  LANGUAGE_ASSURANCE_SCHEMA_VERSION,
  SYSTEM_POLICY_BUSINESS_AUDIO,
  SYSTEM_POLICY_PREVIEW,
} from './assurance.types';

export function languageAssuranceCatalog() {
  const spokenAsr =
    process.env.LANGUAGE_ASSURANCE_SPOKEN_ASR === '1' || process.env.NODE_ENV === 'test';

  return {
    id: 'language-assurance',
    name: 'Lugemi Language Assurance',
    headline: 'Check meaning and speech before release.',
    description:
      'Shared quality-control service for source text, translations, and generated speech. Produces version-bound evidence — not certification or proof of comprehension.',
    schemaVersion: LANGUAGE_ASSURANCE_SCHEMA_VERSION,
    noticeVersion: LANGUAGE_ASSURANCE_NOTICE_VERSION,
    featureFlag: LANGUAGE_ASSURANCE_FEATURE,
    calibrationVersion: LANGUAGE_ASSURANCE_CALIBRATION_VERSION,
    corridors: ASSURANCE_CORRIDORS.map((c) => ({
      ...c,
      spokenAsr: c.spokenAsr && spokenAsr,
    })),
    policies: [SYSTEM_POLICY_BUSINESS_AUDIO, SYSTEM_POLICY_PREVIEW],
    stages: [
      'structural_audio_integrity',
      'critical_information',
      'semantic_fidelity',
      'spoken_realization',
      'native_review',
    ],
    dispositions: [
      'eligible_under_policy',
      'needs_clarification',
      'human_review_required',
      'blocked',
      'indeterminate',
    ],
    integrations: {
      voiceStudio: {
        available: true,
        endpoint: 'POST /v1/language-assurance/integrations/voice-studio',
        note: 'Verify script/translation/audio takes; export pins eligible reviewed release.',
      },
      voiceBridge: {
        available: true,
        note: 'Task-specific adapter — critical discrepancy blocks spoken variant.',
      },
      dealBridge: {
        available: true,
        note: 'Assurance eligibility never substitutes for two-party confirmation.',
      },
      meetingBridge: {
        available: true,
        note: 'Check committed translations and proposed actions; corrections invalidate dependent reviews.',
      },
      accessLine: {
        available: false,
        note: 'Live bounded checks deferred until latency policy is evaluated — batch Assurance is not a live guarantee.',
      },
    },
    endpoints: {
      catalog: 'GET /v1/language-assurance/catalog',
      createRun: 'POST /v1/language-assurance/runs',
      getRun: 'GET /v1/language-assurance/runs/:id',
      cancel: 'POST /v1/language-assurance/runs/:id/cancel',
      report: 'GET /v1/language-assurance/runs/:id/report',
      assignReview: 'POST /v1/language-assurance/runs/:id/assignments',
      submitReview: 'POST /v1/language-assurance/reviews/:id/submit',
      releaseEvidence: 'POST /v1/language-assurance/runs/:id/release-evidence',
      createPolicy: 'POST /v1/language-assurance/policies',
    },
    honesty: [
      'Eligible under policy means configured checks completed for exact artifact hashes — not guaranteed correctness.',
      'Unavailable required stages yield indeterminate/blocked, never silent pass.',
      'An LLM cannot approve release, waive checks, or impersonate a reviewer.',
      'Matching TTS→ASR transcripts do not certify pronunciation or naturalness.',
      'Calibration version is unmeasured until native-adjudicated eval results are published.',
      'Distinct from Language Integrity (provenance/watermarks).',
    ],
    limitations: [
      'Not legal certification or competitive superiority claims.',
      'English↔Akan and English↔French corridors are wired; spoken realization speech recognition remains gated until measured.',
      'Live AccessLine/MeetingBridge duplex guarantees are out of scope for this async service.',
      'Overrides disabled in system policies.',
    ],
  };
}
