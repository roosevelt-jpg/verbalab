/**
 * Lugemi Data Advantage — rights-aware error acquisition for the next-model portfolio.
 * Extends Dataset Cloud / MLOps; does not create parallel infrastructure.
 */
export function dataAdvantageCatalog() {
  return {
    product: 'Lugemi Data Advantage',
    model_id: 'lugemi-data-advantage',
    model_version: 'pilot-1',
    family: 'Dataset Cloud + MLOps',
    note:
      'Permissioned corpus workflow for authentic switches, meaning contrasts, timed repairs, register cases, language acquisition, device conditions, and grounded regions. Ordinary transcripts alone do not teach which mistakes matter. Language tags validate against the full registry. No silent online gradient updates from live customer conversations.',
    streams: [
      { id: 'mixed_conversation', capture: 'Real switching, borrowing, self-correction, acoustic conditions', main_use: 'Mix' },
      { id: 'meaning_contrasts', capture: 'Changed negations, amounts, units, obligations, entity identity', main_use: 'Fidelity' },
      { id: 'timed_interpretation', capture: 'Timestamps, valid commit points, corrections, listener playback', main_use: 'Live' },
      { id: 'intent_register', capture: 'Requests, refusals, uncertainty, conditional promises, alternatives', main_use: 'Pragmatics' },
      { id: 'language_acquisition', capture: 'Learning curves, new speakers, varieties, orthographies, annotator effort', main_use: 'Language Kit' },
      { id: 'device_conditions', capture: 'Microphone, compression, memory, energy, offline behavior', main_use: 'Edge' },
      { id: 'grounded_regions', capture: 'Selected region, OCR evidence, spoken reference, contradiction labels', main_use: 'Grounded' },
    ],
    pipeline_stages: [
      'ingest',
      'permission_validation',
      'malware_media_validation',
      'pii_treatment',
      'duplicate_grouping',
      'split_assignment',
      'annotation',
      'adjudication',
      'frozen_release',
    ],
    permitted_purposes: [
      'service_processing',
      'storing_recordings',
      'model_training',
      'voice_synthesis_cloning',
      'external_evaluation',
      'publication',
      'redistribution',
    ],
    apis: {
      engine: 'GET /v1/data-advantage/engine',
      streams: 'GET /v1/data-advantage/streams',
      contributors: 'POST /v1/data-advantage/contributors',
      withdraw: 'POST /v1/data-advantage/contributors/{id}/withdraw',
      ingest: 'POST /v1/data-advantage/records',
      exportCheck: 'POST /v1/data-advantage/records/export-check',
      errorLoop: 'POST /v1/data-advantage/error-loop/sample',
      releases: 'POST /v1/data-advantage/releases',
      pipeline: 'GET /v1/data-advantage/pipeline',
    },
    console: '/data-advantage',
    docs: '/docs/next-model-portfolio/08_DATA.md',
  };
}
