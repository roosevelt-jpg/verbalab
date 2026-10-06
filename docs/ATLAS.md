# VerbaLab Atlas

**Status:** Partial scaffold (VL-225 / library Phase 92)  
**Rule:** Atlas is a **family interface scaffold** — not trained competitive foundation weights. Inference stays on Gateway vendors; training/eval/registry hand off to Volume 9 MLOps hubs. See Volume 9 README and ADR-0140.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Atlas LRM product | **Scaffold** — `/atlas` + capability catalog |
| Reasoning / Planning | **Partial** — Reasoning Runtime handoff |
| Coding / Math / Science / Business / Legal / Medical / Financial | **Deferred** specialists |
| Multilingual | **Partial** — Gateway chat |
| Long Context | **Partial** — Context Runtime |
| Function Calling / Tool Use | **Partial** — Agent Runtime sandbox + Policy |
| Training Pipeline | **Partial** — Model Training Platform |
| Inference / Serving | **Partial** — Gateway + Model Serving |
| Evaluation / Benchmarking | **Partial** — Model Evaluation Platform |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/atlas` |
| REST engine | `GET /v1/atlas/engine` |
| Capabilities | `GET /v1/atlas/capabilities` |
| Overview | `GET /v1/atlas/overview` |
| Monitoring | `GET /v1/atlas/monitoring` |
| GraphQL | `atlasCapabilities` |
| SDK | `atlasEngine()` |
| CLI | `verbalab atlas-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `scaffoldOnly` | true |
| `shipsTrainedAtlasWeights` | false |
| `trainsCompetitiveFoundationWeights` | false |
| `openAiReplacementOs` | false |
| `frontierLabOs` | false |

See ADR-0140.
