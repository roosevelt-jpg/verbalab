# Lugemi Knowledge Analytics

**Status:** Partial (VL-202 / library Phase 69)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Usage/quality aggregates for Knowledge Cloud only. Extends VL-062 + Volume 6 hubs. Authed surfaces are org/workspace-scoped. Do **not** regenerate Language/Speech/Voice/Intelligence analytics or invent a BI dashboard OS.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/knowledge-analytics` |
| Engine | `GET /v1/knowledge-analytics/engine` |
| Overview | `GET /v1/knowledge-analytics/overview` |
| Growth / usage / quality | `GET …/growth` · `/usage` · `/quality` |
| Search / gaps / confidence | `GET …/search` · `/gaps` · `/confidence` |
| Relationships | `GET /v1/knowledge-analytics/relationships` |
| Report / monitoring | `GET …/report` · `/monitoring` |
| GraphQL | `knowledgeAnalytics` |
| SDK / CLI | `knowledgeAnalyticsEngine()` · `lugemi knowledge-analytics` |

## Tracks

| Track | Source |
| --- | --- |
| Knowledge Growth | `knowledge_documents` / `knowledge_chunks` counts |
| Knowledge Usage | Knowledge Cloud audit actions |
| Knowledge Quality | Ready/failed/chunk coverage proxies |
| Search Success | `enterprise_search.searched` hit metadata |
| Knowledge Gaps | Unchunked/failed/zero-hit/unassigned |
| Knowledge Confidence | Heuristic doc scores (not calibrated) |
| Knowledge Relationships | KG entities/edges + taxonomy + ontology |

## Honesty

| Flag | Value |
| --- | --- |
| `regeneratesLanguageAnalytics` | false |
| `regeneratesSpeechAnalytics` | false |
| `regeneratesVoiceAnalytics` | false |
| `regeneratesIntelligenceAnalytics` | false |
| `biDashboardOs` | false |
| `enterpriseReportingSuite` | false |
| `aggregatesOnly` | true |
| `orgWorkspaceScoped` | true |
| `calibratedConfidence` | false |

See ADR-0113.
