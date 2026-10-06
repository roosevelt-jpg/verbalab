# VerbaLab Intelligence Analytics

**Status:** Partial shipped (VL-191 / library Phase 58)  
**Rule:** Usage/quality aggregates for **Intelligence Cloud** surfaces only. Do **not** regenerate Language, Speech, or Voice analytics products. Not a BI dashboard OS or enterprise reporting suite.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Reasoning | **Shipped** — reasoning_cloud audit counts |
| Memory | **Shipped** — memory_cloud audits |
| Knowledge Usage | **Shipped** — vector/KG/context audits |
| Embeddings | **Shipped** — usage_events + embed audits |
| Latency | **Partial** — latencyMs from audits when present |
| Quality / Confidence | **Partial** — prompt eval + decision confidence proxies |
| Model Routing | **Partial** — Decision Engine kind/decision counts |
| Cost | **Shipped** — estimated chat/embeddings USD |
| Enterprise Reports | **Deferred** |
| Dashboard / Report | **VL-191** — `/intelligence-analytics` + `/report` |
| GraphQL / SDK / CLI | `intelligenceAnalytics`, `verbalab intelligence-analytics` |

---

## Honesty

Distinct from `/analytics`, `/speech-analytics`, `/voice-analytics`. See ADR-0102.
