/**
 * Lugemi Advantage Protocol — corridor-specific evaluation contract.
 * Extends evaluation / research platforms. Never invents superiority claims.
 */
export function corridorBenchmarksCatalog() {
  return {
    product: 'Lugemi Advantage Protocol',
    model_id: 'lugemi-corridor-benchmarks',
    model_version: 'pilot-1',
    family: 'Evaluation + Research Cloud',
    note:
      'Prove or disprove a named task advantage before claiming it. Test corridor, variety, domain, device, input distribution, model/version, date and quality/cost operating point. A missing competing capability is a coverage difference, not an accuracy score of zero. No invented confidence scores.',
    claim_boundary:
      'Broad superiority claims are not useful gates. A product can win one corridor and lose another.',
    comparison_matrix: [
      {
        task: 'mixed_language_asr',
        lugemi_baseline: 'Existing Echo/gateway recognizer',
        external_comparison: 'Matched API-accessible batch/realtime recognizer appropriate to input',
        rule: 'Match audio, vocabulary hints, endpoint class and language availability',
      },
      {
        task: 'translation_fidelity',
        lugemi_baseline: 'Existing Translate and glossary',
        external_comparison: 'Eligible MT models plus reviewed interpreter reference',
        rule: 'Compare translation tasks; a TTS service is not an MT comparator',
      },
      {
        task: 'voice_quality',
        lugemi_baseline: 'Existing Voice',
        external_comparison: 'Matched synthesis model appropriate to language and use',
        rule: 'Match script, permitted voices, bitrate, generation settings and target-language support',
      },
      {
        task: 'batch_dubbing',
        lugemi_baseline: 'Existing Lugemi media pipeline',
        external_comparison: 'Matched dubbing workflow if target/source supported',
        rule: 'Match source media, direction, edit allowances and output task',
      },
      {
        task: 'live_interpreted_conversation',
        lugemi_baseline: 'Existing Lugemi cascade',
        external_comparison: 'Matched composed streaming pipeline (label as composed, not native competitor interpreter)',
        rule: 'Component isolation and end-to-end comparisons both required',
      },
      {
        task: 'offline_task',
        lugemi_baseline: 'Current Edge pack',
        external_comparison: 'Commercially eligible on-device baseline',
        rule: 'Cloud-only execution is not an equivalent offline test',
      },
    ],
    measurement_definitions: [
      {
        id: 'critical_meaning_error',
        definition:
          'Bilingual adjudication finds changed negation, material quantity/unit, identity, obligation, time, requested action or another preregistered consequential fact.',
      },
      {
        id: 'asr',
        definition:
          'WER/CER per language span with documented orthographic normalization, entity preservation and switch-boundary quality. Publish raw and normalized where normalization changes interpretation.',
      },
      {
        id: 'translation',
        definition:
          'Human adequacy and critical errors are primary. BLEU/chrF and learned metrics are secondary and must be validated on the specific language/domain.',
      },
      {
        id: 'speech_output',
        definition:
          'Native pronunciation and intelligibility, tonal minimal-pair recognition where appropriate, content fidelity. MOS alone cannot establish translation fidelity.',
      },
      {
        id: 'streaming',
        definition:
          'Include input capture, sufficient-context time, queue, inference, verifier, TTS, network and actual playback. Report p50/p95, revision churn, repairs.',
      },
      {
        id: 'uncertainty',
        definition:
          'Calibrated predicted event, calibration error/reliability diagrams, selective risk, rejection/clarification rate, outcome at matched accepted coverage. Do not invent confidence scores.',
      },
      {
        id: 'economics',
        definition:
          'Paid provider usage or measured GPU allocation, hosting, retries, validation, human review and support divided by completed successful tasks.',
      },
    ],
    integration_cases: [
      'unsupported_language',
      'mixed_language_unknown_span',
      'ambiguous_amount',
      'late_negation',
      'silence',
      'disconnect_reconnect',
      'cancellation_during_playback',
      'tenant_crossing_document_reference',
      'withdrawn_training_permission',
      'stale_glossary_version',
      'corrupted_edge_pack',
      'cloud_forbidden_mode',
      'document_prompt_injection',
      'unresolvable_visual_reference',
    ],
    investment_gates: [
      'Real held-out gain versus existing Lugemi',
      'Fair external comparison on matched corridors',
      'Paying design-partner task outcomes',
    ],
    apis: {
      engine: 'GET /v1/corridor-benchmarks/engine',
      comparisonMatrix: 'GET /v1/corridor-benchmarks/comparison-matrix',
      measurements: 'GET /v1/corridor-benchmarks/measurements',
      integrationCases: 'GET /v1/corridor-benchmarks/integration-cases',
      runIntegration: 'POST /v1/corridor-benchmarks/integration-cases/{id}/run',
      studies: 'POST /v1/corridor-benchmarks/studies',
      score: 'POST /v1/corridor-benchmarks/studies/{id}/score',
      validateClaim: 'POST /v1/corridor-benchmarks/claims/validate',
    },
    console: '/corridor-benchmarks',
    docs: '/docs/next-model-portfolio/09_BENCHMARKS.md',
  };
}
