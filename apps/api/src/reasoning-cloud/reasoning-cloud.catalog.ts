export type ReasoningCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type ReasoningCapability = {
  id: string;
  name: string;
  status: ReasoningCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 53 → Reasoning Cloud (VL-186). LLM gateway multi-step prompts — not a custom reasoner kernel. */
export function reasoningCloudCatalog() {
  return {
    product: 'VerbaLab Reasoning Cloud',
    note:
      'Multi-step reasoning via AI Gateway chat prompts (VL-186). Chain/plan/decision/problem-solving shipped as prompt strategies. Tree-of-thought is shallow branching. Not a proprietary symbolic reasoner or agent OS.',
    capabilities: [
      {
        id: 'chain-of-thought',
        name: 'Chain of Thought',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=chain_of_thought — numbered steps then answer.',
      },
      {
        id: 'tree-of-thought',
        name: 'Tree of Thought',
        status: 'partial',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=tree_of_thought — 2 candidate branches + pick. Not full ToT research.',
      },
      {
        id: 'graph-reasoning',
        name: 'Graph Reasoning',
        status: 'partial',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'Injects Knowledge Graph 1-hop context into prompt. No graph algorithm engine.',
      },
      {
        id: 'multilingual-reasoning',
        name: 'Multilingual Reasoning',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'Optional language hint; still LLM gateway, not a separate reasoner.',
      },
      {
        id: 'planning',
        name: 'Planning',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=planning — ordered plan then next action.',
      },
      {
        id: 'decision-making',
        name: 'Decision Making',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=decision — options, criteria, recommendation.',
      },
      {
        id: 'problem-solving',
        name: 'Problem Solving',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=problem_solving — diagnose, options, solution.',
      },
      {
        id: 'tool-selection',
        name: 'Tool Selection',
        status: 'partial',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'Suggests from a fixed catalog; does not execute tools.',
      },
      {
        id: 'knowledge-retrieval',
        name: 'Knowledge Retrieval',
        status: 'shipped',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'Optional Context Engine assemble before reason (retrieve=true).',
      },
      {
        id: 'agent-reasoning',
        name: 'Agent Reasoning',
        status: 'partial',
        api: 'POST /v1/reasoning-cloud/reason',
        notes: 'strategy=agent — single-shot agent-style prompt. Full agent OS deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/reasoning-cloud/analytics',
        notes: 'Reason call audits + chat token usage proxy.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/reasoning-cloud/monitoring',
        notes: 'Snapshot + deferred kernel flags.',
      },
    ] satisfies ReasoningCapability[],
    honesty: {
      customReasonerKernel: false,
      symbolicReasonerOs: false,
      fullTreeOfThought: false,
      agentOs: false,
      toolExecution: false,
      llmGateway: true,
    },
    links: {
      console: '/reasoning-cloud',
      hub: '/intelligence-cloud',
      chat: '/chat',
      contextEngine: '/context-engine',
      knowledgeGraph: '/knowledge-graph',
      reason: 'POST /v1/reasoning-cloud/reason',
      openapi: '/v1/openapi.json',
      docs: '/docs/REASONING_CLOUD.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      backend: 'llm_gateway',
    },
  };
}

export const REASONING_STRATEGIES = [
  'chain_of_thought',
  'tree_of_thought',
  'graph_reasoning',
  'planning',
  'decision',
  'problem_solving',
  'tool_selection',
  'agent',
] as const;

export type ReasoningStrategy = (typeof REASONING_STRATEGIES)[number];

export const REASONING_TOOL_CATALOG = [
  { id: 'translate', name: 'Translate', api: 'POST /v1/translate' },
  { id: 'chat', name: 'Chat', api: 'POST /v1/chat/completions' },
  { id: 'knowledge_query', name: 'Knowledge RAG', api: 'POST /v1/knowledge/query' },
  { id: 'vector_search', name: 'Vector Search', api: 'POST /v1/vector-cloud/search' },
  { id: 'memory_search', name: 'Memory Search', api: 'POST /v1/memory-cloud/search' },
  { id: 'context_assemble', name: 'Context Assemble', api: 'POST /v1/context-engine/assemble' },
  { id: 'tts', name: 'Text-to-Speech', api: 'POST /v1/tts/synthesize' },
] as const;
