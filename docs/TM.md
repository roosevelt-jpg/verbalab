# Enterprise Translation Memory (VL-145 / Phase 13)

Scoped translation memory on VL-051 exact matching. **Not** Phrase, MemoQ, or Trados parity.

## Catalog

`GET /v1/tm`

## Scopes

| Scope | Behavior |
| --- | --- |
| `workspace` | Default; exact match in current workspace |
| `enterprise` | Org-wide exact fallback on translate / search |
| `shared` | Org-shared exact fallback |
| `project` | Requires `projectKey`; project-partitioned memory |

## REST

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/tm` | public | Catalog |
| GET | `/v1/tm/entries` | session | List |
| POST | `/v1/tm/entries` | session | Upsert (+ scope/version) |
| GET | `/v1/tm/entries/:id/versions` | session | Version history |
| DELETE | `/v1/tm/entries/:id` | session | Delete |
| POST | `/v1/tm/search` | API key / session | Similarity search |
| GET | `/v1/tm/history` | session | Versions + audits |
| GET | `/v1/tm/terminology` | session | Glossary façade |
| GET | `/v1/tm/analytics` | API key / session | Usage |

## Similarity / vector

- **Lexical (always):** character-bigram Dice coefficient over candidate segments.
- **Vector (partial):** when `OPENAI_API_KEY` is set, source embeddings are stored in pgvector and can re-rank (`mode=auto|vector`).

## Glossaries / terminology

Existing `/v1/glossary/terms` (VL-050) + vertical packs (VL-103). `GET /v1/tm/terminology` is a façade — not a separate termbase product.

## GraphQL

- `tmIntelligence`
- `searchTm`

## SDK

```ts
await client.tmIntelligence();
await client.searchTm({ text, sourceLang: 'en', targetLang: 'sw' });
await client.tmAnalytics();
```

## Dashboard

`/tm` — scopes, save, similarity search.

## Translate integration

`lookupExact` checks workspace first, then org `enterprise`/`shared` (and `project` when a project key is provided). Exact hits still set `tmHit` and bypass MT quota.
