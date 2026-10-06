export type TranslateCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TranslateCapability = {
  id: string;
  name: string;
  status: TranslateCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 8 → Lugemi Translate (VL-140). */
export function translateEngineCatalog() {
  return {
    product: 'Lugemi Translate',
    note:
      'Curated translation engine over Google MT + TM/glossary/quality. Not a website/WhatsApp localization platform.',
    capabilities: [
      {
        id: 'realtime',
        name: 'Realtime translation',
        status: 'shipped',
        api: 'POST /v1/translate',
        notes: 'Synchronous text MT with glossary/TM/locale DNT.',
      },
      {
        id: 'batch',
        name: 'Batch translation',
        status: 'shipped',
        api: 'POST /v1/jobs type=batch_translate',
        notes: 'Up to 100 items per job; webhooks optional.',
      },
      {
        id: 'streaming',
        name: 'Streaming translation',
        status: 'shipped',
        api: 'POST /v1/translate/stream',
        notes: 'SSE chunked paragraph/sentence stream (VL-140).',
      },
      {
        id: 'document',
        name: 'Document translation',
        status: 'partial',
        api: 'POST /v1/documents/translate',
        notes: 'DOCX/PDF/TXT in; DOCX or plain text out. Not layout-faithful PDF.',
      },
      {
        id: 'json',
        name: 'JSON translation',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Key-stable; ICU passthrough.',
      },
      {
        id: 'yaml',
        name: 'YAML translation',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Same localize pipeline as JSON.',
      },
      {
        id: 'html',
        name: 'HTML translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Tag-preserving text-node MT (VL-140).',
      },
      {
        id: 'markdown',
        name: 'Markdown translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Code fences preserved (VL-140).',
      },
      {
        id: 'xml',
        name: 'XML translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Markup-preserving text MT (VL-140).',
      },
      {
        id: 'csv',
        name: 'CSV translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Cell MT. Not Excel/XLSX (VL-140).',
      },
      {
        id: 'srt',
        name: 'Subtitle translation (SRT)',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Cue text MT; timestamps preserved (VL-140).',
      },
      {
        id: 'word',
        name: 'Word (DOCX)',
        status: 'partial',
        api: 'POST /v1/documents/translate',
        notes: 'Extract + re-pack; styles limited.',
      },
      {
        id: 'pdf',
        name: 'PDF',
        status: 'partial',
        api: 'POST /v1/documents/translate',
        notes: 'Text extract; output is text/DOCX, not PDF.',
      },
      {
        id: 'chat',
        name: 'Chat translation',
        status: 'partial',
        api: 'POST /v1/translate/chat',
        notes: 'Translates message content array (VL-140). Full LLM chat is /v1/chat/completions.',
      },
      {
        id: 'slack',
        name: 'Slack',
        status: 'partial',
        api: 'POST /v1/connectors/slack/commands',
        notes: 'Slash-command MT. Not Events API file pipeline.',
      },
      {
        id: 'website',
        name: 'Website translation',
        status: 'deferred',
        api: null,
        notes: 'No crawl/proxy product.',
      },
      {
        id: 'email',
        name: 'Email translation',
        status: 'deferred',
        api: null,
        notes: 'Outbound Resend notifications only — not MIME body MT.',
      },
      {
        id: 'powerpoint',
        name: 'PowerPoint',
        status: 'deferred',
        api: null,
        notes: 'Use CSV/HTML export or document path later.',
      },
      {
        id: 'excel',
        name: 'Excel',
        status: 'deferred',
        api: null,
        notes: 'CSV supported; XLSX deferred.',
      },
      {
        id: 'sms',
        name: 'SMS',
        status: 'deferred',
        api: null,
        notes: 'No SMS gateway product.',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        status: 'deferred',
        api: null,
        notes: 'No WhatsApp Business API product.',
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        status: 'deferred',
        api: null,
        notes: 'Slack connector only for now.',
      },
    ] satisfies TranslateCapability[],
    engines: {
      translation: { status: 'shipped', api: 'POST /v1/translate' },
      translationMemory: { status: 'partial', api: '/v1/tm', notes: 'Exact hash matches' },
      terminologyGlossary: { status: 'shipped', api: '/v1/glossary' },
      quality: { status: 'partial', api: '/v1/reviews', notes: 'Heuristic QE' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', api: 'mutation translate', notes: 'VL-140' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      cli: { status: 'shipped', package: '@lugemi/cli' },
      monitoring: { status: 'shipped', api: 'GET /v1/metrics/translate' },
      analytics: { status: 'shipped', api: 'GET /v1/analytics/overview' },
    },
    links: {
      translate: '/translate',
      formats: '/translate/formats',
      documents: '/documents',
      localize: '/localize',
      glossary: '/glossary',
      tm: '/tm',
      reviews: '/reviews',
      docs: '/docs/TRANSLATE.md',
    },
  };
}
