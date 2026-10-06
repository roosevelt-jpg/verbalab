# Lugemi Memory Cloud

**Status:** Partial shipped (VL-183 / library Phase 50)  
**Rule:** Persist AI interaction memory only with **GDPR export + erase** available. Do not claim infinite personalization OS. Do not confuse with Translation Memory (VL-051).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Conversation / Workspace / Org / Project Memory | **Shipped** — scopes on `memory_records` |
| Agent Memory | **Partial** — `scope=agent` + `agentId`; agent OS deferred |
| Long / Short / Shared Memory | **Shipped** — `kind` values; short_term defaults 24h TTL |
| Semantic Memory | **Partial** — text search; embedding NN deferred |
| Memory Versioning | **Shipped** — revise bumps `version` |
| Memory Search | **Shipped** — `POST /v1/memory-cloud/search` |
| GDPR Export / Erase | **Shipped** — `/export`, `/erase`; also in org export |
| Engine / Dashboard | **VL-183** — `GET /v1/memory-cloud/engine` + `/memory-cloud` |
| Retention sweeper | **Deferred** — `expiresAt` honored on read; no background job |
| GraphQL / SDK / CLI | `memoryCloudEngine`, `lugemi memory-cloud-engine` |

---

## Honesty

Not Mem0/Zep enterprise memory OS. Automated retention sweeper and vector-semantic memory deferred. See ADR-0094.
