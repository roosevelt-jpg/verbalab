# Lugemi Knowledge Intelligence

**Status:** Partial (VL-200 / library Phase 67)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Combined knowledge analysis/insight over EKB, Search, Ontology, Taxonomy, Knowledge Memory, and VL-062. Do **not** invent a BI / Palantir knowledge OS or regenerate [Intelligence Analytics](./INTELLIGENCE_ANALYTICS.md) (VL-191).

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/knowledge-intelligence` |
| Engine | `GET /v1/knowledge-intelligence/engine` |
| Insight | `GET /v1/knowledge-intelligence/insight` |
| Discover | `POST /v1/knowledge-intelligence/discover` `{ query }` |
| Link | `POST /v1/knowledge-intelligence/link` `{ documentId }` |
| Recommend | `POST /v1/knowledge-intelligence/recommend` `{ query? }` |
| Validate | `POST /v1/knowledge-intelligence/validate` `{ documentId? }` |
| Duplicates | `POST /v1/knowledge-intelligence/duplicates` |
| Confidence | `POST /v1/knowledge-intelligence/confidence` `{ documentId? }` |
| Evolution | `GET /v1/knowledge-intelligence/evolution` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `knowledgeIntelligenceEngine` |
| SDK / CLI | `knowledgeIntelligenceEngine()` · `lugemi knowledge-intelligence-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `biOs` | false |
| `palantirParity` | false |
| `mlNearDuplicate` | false |
| `calibratedConfidence` | false |
| `regeneratesIntelligenceAnalytics` | false |
| `orgWorkspaceScoped` | true |
| `extendsKnowledgeCloud` | true |

All paths are org/workspace scoped. See ADR-0111.
