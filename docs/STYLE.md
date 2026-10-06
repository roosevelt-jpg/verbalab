# Style Intelligence (VL-143 / Phase 11)

Bounded writing-style engine on top of VL-134. Heuristic tone detection, tone transform, and profile transfer — **not** author style cloning or certified medical/legal/marketing/government writing products.

## Catalog

`GET /v1/style/intelligence` — capability matrix (formal, professional, academic, legal, medical, business, marketing, technical, government, casual, detect, transform, transfer).

## Profiles

`GET /v1/style/profiles`

| Profile | Notes |
| --- | --- |
| formal, professional, academic, business, technical, casual, concise, plain | General tone transforms |
| marketing | Tone assist + disclaimer |
| medical, legal, government | Tone assist + mandatory disclaimers |

## REST

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/style/intelligence` | public | Catalog |
| GET | `/v1/style/profiles` | public | Profile list |
| POST | `/v1/style/rewrite` | API key / session | Rewrite to profile |
| POST | `/v1/style/detect` | API key / session | Heuristic tone detect |
| POST | `/v1/style/transform` | API key / session | Tone transform (`targetTone`) |
| POST | `/v1/style/transfer` | API key / session | Detect source → rewrite target |
| GET | `/v1/style/analytics` | API key / session | Audit-derived usage |

## GraphQL

- `styleIntelligence`
- `detectTone`
- `transformTone`
- `transferStyle`
- Existing `rewriteStyle`

## SDK

```ts
await client.styleIntelligence();
await client.detectTone({ text });
await client.transformTone({ text, targetTone: 'formal' });
await client.transferStyle({ text, targetProfile: 'professional' });
await client.styleAnalytics();
```

## Dashboard

`/style-intelligence` — catalog + detect + transfer. `/style` remains the rewrite console.

## Monitoring

Shared translate metrics stack (`GET /v1/metrics/translate`). Style usage is audit-counted via `/v1/style/analytics`.

## Honesty bounds

- Tone detection is cue scoring, not a trained classifier.
- Style transfer is detect-then-rewrite, not author cloning.
- Medical / legal / government / marketing profiles are tone-only with disclaimers.
