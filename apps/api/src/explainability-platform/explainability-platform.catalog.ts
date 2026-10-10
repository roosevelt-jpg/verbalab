/**
 * Explainability Platform.
 * Not SHAP OS — confidence/evidence/attribution/decision-trace/provenance.
 */
export type ExplanationRecord = {
  id: string;
  decisionId: string;
  confidence: number;
  evidence: string[];
  attribution: string[];
  decisionTrace: string[];
  provenance: {
    model?: string;
    dataset?: string;
    prompt?: string;
    knowledge?: string;
  };
  notes: string;
};

export function seedExplanations(): ExplanationRecord[] {
  return [
    {
      id: 'xai-001',
      decisionId: 'dec-support-triage-42',
      confidence: 0.91,
      evidence: ['ticket keywords match FAQ cluster', 'prior similar resolution'],
      attribution: ['prompt:customer-faq-v3', 'rag:chunk-884'],
      decisionTrace: ['retrieve', 'rank', 'generate', 'policy-check', 'respond'],
      provenance: {
        model: 'support-triage-v2',
        dataset: 'faq-corpus-17',
        prompt: 'customer-faq-v3',
        knowledge: 'kb-support',
      },
      notes: 'High-confidence support answer with source attribution.',
    },
    {
      id: 'xai-002',
      decisionId: 'dec-risk-score-9',
      confidence: 0.72,
      evidence: ['elevated third-party score', 'recent policy violation'],
      attribution: ['risk-intelligence:third-party', 'agentops:apol-001'],
      decisionTrace: ['collect-signals', 'score', 'explain'],
      provenance: { model: 'risk-scorer-v1', knowledge: 'trust-signals' },
      notes: 'Medium confidence — human review recommended.',
    },
    {
      id: 'xai-003',
      decisionId: 'dec-privacy-redact-3',
      confidence: 0.97,
      evidence: ['PHI pattern match', 'retention policy hit'],
      attribution: ['privacy-platform:phi', 'retention:90d'],
      decisionTrace: ['detect', 'classify', 'redact', 'audit'],
      provenance: { prompt: 'privacy-redact', dataset: 'phi-patterns' },
      notes: 'Redaction decision with PHI evidence.',
    },
  ];
}

export function explainabilityPlatformEngineCatalog() {
  const explanations = seedExplanations();
  return {
    product: 'Lugemi Explainability Platform',
    capabilities: [
      { id: 'confidence', name: 'Confidence Scores', status: 'shipped', notes: 'Per-decision confidence.' },
      { id: 'evidence', name: 'Evidence', status: 'shipped', notes: 'Evidence bundles.' },
      { id: 'attribution', name: 'Source Attribution', status: 'shipped', notes: 'Prompt/RAG/model attribution.' },
      { id: 'decision_trace', name: 'Decision Trace', status: 'shipped', notes: 'Step traces.' },
      { id: 'model_metadata', name: 'Model Metadata', status: 'shipped', notes: 'Model provenance.' },
      { id: 'dataset_provenance', name: 'Dataset Provenance', status: 'shipped', notes: 'Dataset lineage.' },
      { id: 'prompt_provenance', name: 'Prompt Provenance', status: 'shipped', notes: 'Prompt lineage.' },
      { id: 'knowledge_provenance', name: 'Knowledge Provenance', status: 'shipped', notes: 'Knowledge lineage.' },
    ],
    explanations,
    honesty: {
      shapOs: false,
      limeOs: false,
      regeneratesPriorLayers: false,
      decisionExplainabilitySurface: true,
    },
    safety: {
      shapOs: false,
      note: 'Explainability catalog for confidence/evidence/attribution/traces — not a SHAP/LIME research OS.',
    },
    docs: '/docs/EXPLAINABILITY_PLATFORM.md',
    note: 'Explainability Platform. Decision explainability seed — shapOs=false.',
  };
}
