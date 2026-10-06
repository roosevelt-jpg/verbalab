export type GrammarCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type GrammarCapability = {
  id: string;
  name: string;
  status: GrammarCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 10 → Lugemi Grammar Intelligence (VL-142). */
export function grammarIntelligenceCatalog() {
  return {
    product: 'Grammar Intelligence',
    note:
      'Rules + optional LLM grammar/spell/style assist. Not Grammarly parity or certified medical/legal/government writing products.',
    capabilities: [
      {
        id: 'grammar_checking',
        name: 'Grammar checking',
        status: 'shipped',
        api: 'POST /v1/grammar/check',
        notes: 'Deterministic rules + optional LLM (VL-133).',
      },
      {
        id: 'spell_checking',
        name: 'Spell checking',
        status: 'shipped',
        api: 'POST /v1/grammar/spell',
        notes: 'Curated misspelling list — not a full dictionary product (VL-142).',
      },
      {
        id: 'sentence_correction',
        name: 'Sentence correction',
        status: 'shipped',
        api: 'POST /v1/grammar/correct',
        notes: 'Returns corrected text from grammar pipeline.',
      },
      {
        id: 'writing_suggestions',
        name: 'Writing suggestions',
        status: 'shipped',
        api: 'POST /v1/grammar/suggest',
        notes: 'Combined grammar issues + optional style suggestions.',
      },
      {
        id: 'style_suggestions',
        name: 'Style suggestions',
        status: 'shipped',
        api: 'POST /v1/style/rewrite',
        notes: 'Bounded profiles (VL-134 + VL-142 domain tones).',
      },
      {
        id: 'professional_writing',
        name: 'Professional writing',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=professional',
        notes: 'Business formality transforms.',
      },
      {
        id: 'academic_writing',
        name: 'Academic writing',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=academic',
        notes: 'Formal register transforms — not a citation manager.',
      },
      {
        id: 'medical_writing',
        name: 'Medical writing',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=medical',
        notes: 'Tone profile only — not clinical documentation or medical advice.',
      },
      {
        id: 'legal_writing',
        name: 'Legal writing',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=legal',
        notes: 'Tone profile only — not legal advice or contract drafting.',
      },
      {
        id: 'government_writing',
        name: 'Government writing',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=government',
        notes: 'Plain formal tone — not policy/compliance certification.',
      },
    ] satisfies GrammarCapability[],
    engines: {
      grammar: { status: 'shipped', api: '/v1/grammar/*' },
      style: { status: 'shipped', api: '/v1/style/*' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'checkGrammar + suggestWriting (VL-142)' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      analytics: { status: 'shipped', api: 'GET /v1/grammar/analytics' },
      monitoring: { status: 'partial', api: 'GET /v1/metrics/translate', notes: 'Shared observability stack' },
    },
    links: {
      dashboard: '/grammar-intelligence',
      grammar: '/grammar',
      style: '/style',
      docs: '/docs/GRAMMAR.md',
    },
  };
}
