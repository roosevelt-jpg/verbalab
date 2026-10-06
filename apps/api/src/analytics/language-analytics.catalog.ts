export type LanguageAnalyticsCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type LanguageAnalyticsCapability = {
  id: string;
  name: string;
  status: LanguageAnalyticsCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Lugemi Language Analytics. */
export function languageAnalyticsCatalog() {
  return {
    product: 'Language Analytics',
    note:
      'Org analytics over usage, translation requests, quality reviews, dialect/accent audits, and estimated costs. Not a BI/analytics cloud or human-evaluation accuracy product.',
    capabilities: [
      {
        id: 'translation_usage',
        name: 'Translation usage',
        status: 'shipped',
        api: 'GET /v1/analytics/translation',
        notes: 'From translation_requests.',
      },
      {
        id: 'language_usage',
        name: 'Language usage',
        status: 'shipped',
        api: 'GET /v1/analytics/languages',
        notes: 'Source/target language aggregates.',
      },
      {
        id: 'country_usage',
        name: 'Country usage',
        status: 'partial',
        api: 'GET /v1/analytics/countries',
        notes: 'Inferred from language↔country-pack mapping — not geo IP analytics.',
      },
      {
        id: 'dialect_usage',
        name: 'Dialect usage',
        status: 'shipped',
        api: 'GET /v1/analytics/dialects',
        notes: 'From dialect.detect / accent.detect audit events.',
      },
      {
        id: 'translation_accuracy',
        name: 'Translation accuracy',
        status: 'partial',
        api: 'GET /v1/analytics/quality',
        notes: 'Review accept/reject + heuristic quality scores — not BLEU/human eval.',
      },
      {
        id: 'quality_scores',
        name: 'Quality scores',
        status: 'shipped',
        api: 'GET /v1/analytics/quality',
        notes: 'translation_reviews qualityScore aggregates.',
      },
      {
        id: 'latency',
        name: 'Latency',
        status: 'shipped',
        api: 'GET /v1/analytics/latency',
        notes: 'DB translation_requests latency percentiles + link to in-process metrics.',
      },
      {
        id: 'costs',
        name: 'Costs',
        status: 'shipped',
        api: 'GET /v1/analytics/costs',
        notes: 'Estimated USD from usage units — not Stripe invoices.',
      },
      {
        id: 'enterprise_reports',
        name: 'Enterprise reports',
        status: 'shipped',
        api: 'GET /v1/analytics/reports/enterprise',
        notes: 'Bundled JSON report for the period.',
      },
    ] satisfies LanguageAnalyticsCapability[],
    engines: {
      analytics: { status: 'shipped', api: '/v1/analytics/*' },
      dashboards: { status: 'shipped', console: '/analytics' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'languageAnalytics + analyticsOverview + enterpriseAnalyticsReport' },
      sdk: { status: 'shipped', package: '@lugemi/sdk' },
      monitoring: { status: 'partial', api: 'GET /v1/metrics/translate', notes: 'In-process p95 + analytics latency' },
      reports: { status: 'shipped', api: 'GET /v1/analytics/reports/enterprise' },
    },
    links: {
      dashboard: '/analytics',
      overview: '/v1/analytics/overview',
      docs: '/docs/ANALYTICS.md',
      metrics: '/v1/metrics/translate',
    },
  };
}
