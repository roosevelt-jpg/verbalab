# Lugemi Enterprise Knowledge APIs

**Status:** Partial (VL-201 / library Phase 68)  
**Parent:** [Knowledge Cloud](./KNOWLEDGE_CLOUD.md)  
**Rule:** Public API pack for Knowledge Cloud (REST, GraphQL, OpenAPI, SDK/CLI, webhooks, light SSE). Extends VL-062 + Volume 6 hubs and [Developer Cloud](./DEVELOPER_CLOUD.md). Authed surfaces are org/workspace-scoped. Do **not** invent gRPC mesh, Kafka event-streaming OS, or multi-language SDK generator factory.

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/knowledge-apis` |
| Engine | `GET /v1/knowledge-apis/engine` |
| Surfaces | `GET /v1/knowledge-apis/surfaces` |
| GraphQL catalog | `GET /v1/knowledge-apis/graphql` |
| OpenAPI index | `GET /v1/knowledge-apis/openapi` → `/v1/openapi.json` |
| SDK / CLI catalogs | `GET /v1/knowledge-apis/sdk` · `/cli` |
| Webhooks | `GET /v1/knowledge-apis/webhooks` (+ `POST /v1/webhooks/signing-secret`) |
| Events | `GET /v1/knowledge-apis/events` · SSE `/events/stream` |
| Analytics / monitoring | `GET …/analytics` · `/monitoring` |
| GraphQL | `knowledgeApisEngine` |
| SDK / CLI | `knowledgeApisEngine()` · `lugemi knowledge-apis-engine` |
| Developer portal | `/developers` (VL-127) |

## Honesty

| Flag | Value |
| --- | --- |
| `grpcOs` | false |
| `kafkaEventStreamingOs` | false |
| `sdkGeneratorOs` | false |
| `regeneratesDeveloperCloud` | false |
| `extendsExistingKnowledgeApis` | true |
| `orgWorkspaceScoped` | true |
| `openapiSharedDocument` | true |

See ADR-0112.
