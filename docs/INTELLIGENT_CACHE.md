# VerbaLab Intelligent Cache

**Status:** Partial (VL-210 / library Phase 77)  
**Parent:** [Inference Cloud](./INFERENCE_CLOUD.md)  
**Rule:** Opt-in org/workspace **exact-key** (and normalized-hash for `semantic`) inference result cache. Does **not** invent Redis Cluster, vector ANN semantic OS, or CDN. Does **not** auto-wire Gateway responses — callers `put` / `lookup` explicitly.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/intelligent-cache` |
| Engine | `GET /v1/intelligent-cache/engine` |
| Namespaces / ceilings | `GET …/namespaces` · `/ceilings` |
| Entries | `GET /v1/intelligent-cache/entries` |
| Put / lookup / invalidate | `POST …/put` · `/lookup` · `/invalidate` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `intelligentCacheEngine` |
| SDK / CLI | `intelligentCacheEngine()` · `verbalab intelligent-cache-engine` |

## Namespaces

semantic · translation · embedding · speech · voice · document · prompt · context

Semantic uses normalized whitespace/case hash — **not** embedding similarity search.

## Env

| Control | Default | Env |
| --- | --- | --- |
| Mode | `sandbox` | `VERBALAB_INTELLIGENT_CACHE_MODE=disabled\|sandbox` |
| Max entries / workspace | 200 (cap 2000) | `VERBALAB_CACHE_MAX_ENTRIES` |
| Default TTL | 3600s (cap 7d) | `VERBALAB_CACHE_DEFAULT_TTL_SEC` |

## Honesty

| Flag | Value |
| --- | --- |
| `redisClusterOs` | false |
| `vectorSemanticOs` | false |
| `cdnOs` | false |
| `autoWiresGatewayResponses` | false |
| `regeneratesAiGateway` | false |
| `exactKeyLookup` | true |

See ADR-0121.
