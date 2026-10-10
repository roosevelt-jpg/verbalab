# Language Analytics (VL-146 / Phase 14)

Org Language Analytics platform over usage, translation requests, quality reviews, dialect/accent audits, and estimated costs. **Not** a BI/analytics cloud, geo-IP product, or human-evaluation accuracy suite.

## Catalog

`GET /v1/analytics`

## REST

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/analytics` | Capability catalog |
| GET | `/v1/analytics/overview` | Feature volume, pairs, cost, job errors (VL-085) |
| GET | `/v1/analytics/translation` | Translation usage by provider |
| GET | `/v1/analytics/languages` | Source/target language usage |
| GET | `/v1/analytics/countries` | Inferred country interest (partial) |
| GET | `/v1/analytics/dialects` | Dialect/accent detect counts |
| GET | `/v1/analytics/quality` | Quality scores + accuracy proxy |
| GET | `/v1/analytics/latency` | DB latency percentiles |
| GET | `/v1/analytics/costs` | Estimated USD breakdown |
| GET | `/v1/analytics/monitoring` | Latency + errors + quality snapshot |
| GET | `/v1/analytics/reports/enterprise` | Bundled enterprise JSON report |

All authenticated routes accept API key or session (`TranslateAuth`). Optional `from` / `to` ISO query params (max 366 days).

## GraphQL

- `languageAnalytics`
- `analyticsOverview`
- `enterpriseAnalyticsReport`

## SDK

```ts
await client.languageAnalyticsCatalog();
await client.analyticsOverview();
await client.analyticsTranslation();
await client.analyticsQuality();
await client.analyticsLatency();
await client.enterpriseAnalyticsReport();
```

## Dashboard

`/analytics` — catalog, overview, quality, latency, dialects, enterprise report button.

## Honesty bounds

- **Country usage** is inferred from language↔country-pack mapping — not geo IP.
- **Translation accuracy** is accept/(accept+reject) plus heuristic quality scores — not BLEU/human eval.
- **Costs** are internal unit estimates — not Stripe invoices.
- **Monitoring** links to in-process `GET /v1/metrics/translate` (single instance).
