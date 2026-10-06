export function fidelityCatalog() {
  return {
    product: 'Lugemi Fidelity',
    model_id: 'lugemi-fidelity',
    model_version: 'pilot-1',
    family: 'Translate + Reason + Trust',
    note:
      'Translation verification and clarification using a meaning ledger. Flags changed negation, quantities, names, and commitments before spoken or agent use. Not certified interpretation.',
    apis: {
      engine: 'GET /v1/fidelity/engine',
      verify: 'POST /v1/fidelity/verify',
      clarify: 'POST /v1/fidelity/clarify',
    },
    console: '/fidelity',
    docs: '/docs/next-model-portfolio/02_FIDELITY.md',
    calibration_version: 'fidelity-cal-pilot-1',
    error_event_definition:
      'Predicted event: critical meaning change between source and target on negation, quantity/unit, identity, obligation, time, or requested action (preregistered).',
  };
}
