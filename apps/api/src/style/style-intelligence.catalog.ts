export type StyleCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type StyleCapability = {
  id: string;
  name: string;
  status: StyleCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 11 → Lugemi Style Intelligence. */
export function styleIntelligenceCatalog() {
  return {
    product: 'Style Intelligence',
    note:
      'Bounded tone profiles, detect, transform, and transfer on rules + optional LLM. Not author style cloning or certified vertical writing products.',
    capabilities: [
      {
        id: 'formal',
        name: 'Formal',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=formal',
        notes: 'High-formality register transforms.',
      },
      {
        id: 'professional',
        name: 'Professional',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=professional',
        notes: 'Business formality.',
      },
      {
        id: 'academic',
        name: 'Academic',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=academic',
        notes: 'Formal register — not a citation manager.',
      },
      {
        id: 'legal',
        name: 'Legal',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=legal',
        notes: 'Tone only — not legal advice or contract drafting.',
      },
      {
        id: 'medical',
        name: 'Medical',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=medical',
        notes: 'Tone only — not clinical documentation or medical advice.',
      },
      {
        id: 'business',
        name: 'Business',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=business',
        notes: 'Workplace clarity transforms.',
      },
      {
        id: 'marketing',
        name: 'Marketing',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=marketing',
        notes: 'Light persuasive tone — not a campaign/copywriting OS.',
      },
      {
        id: 'technical',
        name: 'Technical',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=technical',
        notes: 'Precise engineering-adjacent wording.',
      },
      {
        id: 'government',
        name: 'Government',
        status: 'partial',
        api: 'POST /v1/style/rewrite profile=government',
        notes: 'Plain formal tone — not policy/compliance certification.',
      },
      {
        id: 'casual',
        name: 'Casual',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=casual',
        notes: 'Relaxed register with normalized spacing.',
      },
      {
        id: 'tone_detection',
        name: 'Tone detection',
        status: 'shipped',
        api: 'POST /v1/style/detect',
        notes: 'Heuristic cue scoring — not a trained tone classifier.',
      },
      {
        id: 'tone_transformation',
        name: 'Tone transformation',
        status: 'shipped',
        api: 'POST /v1/style/transform',
        notes: 'Rewrite into a target profile (alias of style engine).',
      },
      {
        id: 'style_transfer',
        name: 'Style transfer',
        status: 'partial',
        api: 'POST /v1/style/transfer',
        notes: 'Detect source tone then rewrite to target profile — not author cloning.',
      },
    ] satisfies StyleCapability[],
    engines: {
      style: { status: 'shipped', api: '/v1/style/*' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'styleIntelligence + detectTone + transformTone + transferStyle' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      analytics: { status: 'shipped', api: 'GET /v1/style/analytics' },
      monitoring: { status: 'partial', api: 'GET /v1/metrics/translate', notes: 'Shared observability stack' },
    },
    links: {
      dashboard: '/style-intelligence',
      style: '/style',
      grammar: '/grammar-intelligence',
      docs: '/docs/STYLE.md',
    },
  };
}
