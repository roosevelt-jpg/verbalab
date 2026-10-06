export type DecisionCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type DecisionCapability = {
  id: string;
  name: string;
  status: DecisionCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 56 → AI Decision Engine (VL-189). Light rules + helpers — not Drools/Pega BRMS. */
export function decisionEngineCatalog() {
  return {
    product: 'Lugemi AI Decision Engine',
    note:
      'Bounded decision helpers for model selection, routing, fallback, confidence, risk, policy, safety, tools, workflows, and cost (VL-189). Light rules over plan/entitlements + fixed catalogs. Optional LLM narrative deferred for most kinds. Not an enterprise BRMS (Drools/Pega parity).',
    capabilities: [
      {
        id: 'model-selection',
        name: 'Model Selection',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=model_selection — chat/embed/tts model pick from fixed catalog + plan.',
      },
      {
        id: 'routing',
        name: 'Routing',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=routing — map intent to API surface (translate/chat/rag/tts/…).',
      },
      {
        id: 'fallback',
        name: 'Fallback',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=fallback — ordered fallback chain for a surface.',
      },
      {
        id: 'confidence-scoring',
        name: 'Confidence Scoring',
        status: 'partial',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=confidence — heuristic confidence from signals, not calibrated ML.',
      },
      {
        id: 'risk-analysis',
        name: 'Risk Analysis',
        status: 'partial',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=risk — light risk flags (PII-ish, injection, quota).',
      },
      {
        id: 'policy-decisions',
        name: 'Policy Decisions',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=policy — plan, vendor-training, retention, org-disabled checks.',
      },
      {
        id: 'safety-decisions',
        name: 'Safety Decisions',
        status: 'partial',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=safety — pattern safety gate. Not a full moderation OS.',
      },
      {
        id: 'tool-selection',
        name: 'Tool Selection',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=tool_selection — pick from fixed tool catalog (suggest only).',
      },
      {
        id: 'workflow-decisions',
        name: 'Workflow Decisions',
        status: 'shipped',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=workflow — pick fixed API recipe.',
      },
      {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        status: 'partial',
        api: 'POST /v1/decision-engine/decide',
        notes: 'kind=cost — prefer cheaper models when quality=economy.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/decision-engine/analytics',
        notes: 'Decide audit aggregates.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/decision-engine/monitoring',
        notes: 'Hub monitoring snapshot.',
      },
      {
        id: 'enterprise-brms',
        name: 'Enterprise BRMS',
        status: 'deferred',
        api: null,
        notes: 'Drools/Pega parity deferred (VL-189 out of scope).',
      },
    ] satisfies DecisionCapability[],
    honesty: {
      enterpriseBrms: false,
      droolsPegaParity: false,
      lightRules: true,
      trainsDecisionModels: false,
      executesTools: false,
    },
    links: {
      console: '/decision-engine',
      hub: '/intelligence-cloud',
      enterprise: '/enterprise',
      reasoningCloud: '/reasoning-cloud',
      decide: 'POST /v1/decision-engine/decide',
      openapi: '/v1/openapi.json',
      docs: '/docs/DECISION_ENGINE.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      backend: 'light_rules',
    },
  };
}

export const DECISION_KINDS = [
  'model_selection',
  'routing',
  'fallback',
  'confidence',
  'risk',
  'policy',
  'safety',
  'tool_selection',
  'workflow',
  'cost',
] as const;

export type DecisionKind = (typeof DECISION_KINDS)[number];

export const DECISION_MODELS = [
  {
    id: 'gpt-4o-mini',
    family: 'chat',
    costTier: 'economy',
    quality: 'good',
    requiresPro: false,
  },
  {
    id: 'gpt-4o',
    family: 'chat',
    costTier: 'standard',
    quality: 'high',
    requiresPro: true,
  },
  {
    id: 'text-embedding-3-small',
    family: 'embedding',
    costTier: 'economy',
    quality: 'good',
    requiresPro: false,
  },
  {
    id: 'tts-1',
    family: 'tts',
    costTier: 'economy',
    quality: 'good',
    requiresPro: false,
  },
  {
    id: 'tts-1-hd',
    family: 'tts',
    costTier: 'standard',
    quality: 'high',
    requiresPro: true,
  },
] as const;

export const DECISION_ROUTES = [
  {
    id: 'translate',
    intentTags: ['translate', 'translation', 'mt', 'localize'],
    api: 'POST /v1/translate',
    console: '/translate',
  },
  {
    id: 'chat',
    intentTags: ['chat', 'ask', 'assistant', 'llm'],
    api: 'POST /v1/chat/completions',
    console: '/chat',
  },
  {
    id: 'rag',
    intentTags: ['rag', 'knowledge', 'docs', 'retrieve'],
    api: 'POST /v1/knowledge/query',
    console: '/knowledge',
  },
  {
    id: 'tts',
    intentTags: ['tts', 'speak', 'voice', 'audio'],
    api: 'POST /v1/tts/synthesize',
    console: '/neural-tts',
  },
  {
    id: 'embed',
    intentTags: ['embed', 'embedding', 'vector'],
    api: 'POST /v1/embeddings',
    console: '/embedding-cloud',
  },
  {
    id: 'reason',
    intentTags: ['reason', 'plan', 'decide', 'analyze'],
    api: 'POST /v1/reasoning-cloud/reason',
    console: '/reasoning-cloud',
  },
] as const;

export const DECISION_TOOLS = [
  { id: 'translate', name: 'Translate', api: 'POST /v1/translate', tags: ['translate', 'language'] },
  { id: 'chat', name: 'Chat', api: 'POST /v1/chat/completions', tags: ['chat', 'llm'] },
  {
    id: 'knowledge_query',
    name: 'Knowledge RAG',
    api: 'POST /v1/knowledge/query',
    tags: ['rag', 'knowledge'],
  },
  {
    id: 'vector_search',
    name: 'Vector Search',
    api: 'POST /v1/vector-cloud/search',
    tags: ['vector', 'search'],
  },
  {
    id: 'memory_search',
    name: 'Memory Search',
    api: 'POST /v1/memory-cloud/search',
    tags: ['memory'],
  },
  {
    id: 'context_assemble',
    name: 'Context Assemble',
    api: 'POST /v1/context-engine/assemble',
    tags: ['context'],
  },
  { id: 'tts', name: 'Text-to-Speech', api: 'POST /v1/tts/synthesize', tags: ['tts', 'voice'] },
] as const;

export const DECISION_WORKFLOWS = [
  {
    id: 'translate_then_tts',
    name: 'Translate then speak',
    tags: ['translate', 'tts', 'voice'],
    apis: ['POST /v1/translate', 'POST /v1/tts/synthesize'],
  },
  {
    id: 'rag_answer',
    name: 'Knowledge RAG answer',
    tags: ['rag', 'knowledge', 'chat'],
    apis: ['POST /v1/knowledge/query'],
  },
  {
    id: 'detect_and_translate',
    name: 'Detect then translate',
    tags: ['detect', 'translate', 'language'],
    apis: ['POST /v1/detect', 'POST /v1/translate'],
  },
  {
    id: 'assemble_and_reason',
    name: 'Assemble context then reason',
    tags: ['context', 'reason', 'plan'],
    apis: ['POST /v1/context-engine/assemble', 'POST /v1/reasoning-cloud/reason'],
  },
] as const;
