# Lugemi Memory Runtime

**Status:** Partial shipped (VL-215 / library Phase 82)  
**Rule:** Kernel-layer memory over VL-183 Memory Cloud (`metadata.layer=kernel`). Extends — does **not** regenerate — Memory Cloud or Knowledge Memory. Not Mem0 / infinite personalization / multi-region replication OS.

Part of the internal [AI Kernel](./AI_KERNEL.md) (Volume 8). Roadmap: [`docs/roadmap/volume8-ai-kernel/`](./roadmap/volume8-ai-kernel/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Short-term Memory | **Shipped** — `kind=short_term` + TTL |
| Long-term Memory | **Shipped** — `kind=long_term` |
| Semantic Memory | **Partial** — text contains search; not embedding ANN |
| Workspace / Org / Conversation Memory | **Shipped** — scopes on kernel `MemoryRecord` rows |
| Agent Memory | **Partial** — `scope=agent` + `agentId`; Agent Runtime VL-219 writes via `/v1/agent-runtime/memory` |
| Context Compression | **Partial** — heuristic truncate; not ML compressor OS |
| Memory Versioning | **Shipped** — revise via Memory Cloud |
| Memory Synchronization | **Partial** — sandbox sync stamp; not multi-region |
| Memory Eviction Policies | **Shipped** — TTL purge + hard entry ceiling |
| Memory Encryption | **Partial** — optional base64 tag; not KMS/HSM |
| Memory Replication | **Deferred** |
| Memory Snapshots | **Partial** — sandbox snapshot rows |
| Engine / Console | `/memory-runtime` + `GET /v1/memory-runtime/engine` |
| GraphQL / SDK / CLI | `memoryRuntimeEngine`, `lugemi memory-runtime-engine` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/memory-runtime` |
| REST engine | `GET /v1/memory-runtime/engine` |
| Put / list / search | `POST /v1/memory-runtime/put`, `GET …/memories`, `POST …/search` |
| Revise / compress / evict / sync | `POST /v1/memory-runtime/revise|compress|evict|sync` |
| Snapshots | `GET|POST /v1/memory-runtime/snapshots` |
| Analytics / monitoring | `GET /v1/memory-runtime/analytics|monitoring` |
| GraphQL | `memoryRuntimeEngine` |
| SDK | `memoryRuntimeEngine()`, `memoryRuntimePut()` |
| CLI | `lugemi memory-runtime-engine` |

## Honesty

| Flag | Value |
| --- | --- |
| `mem0Os` | false |
| `infinitePersonalizationOs` | false |
| `replicationOs` | false |
| `encryptionKmsOs` | false |
| `regeneratesMemoryCloud` | false |
| `regeneratesKnowledgeMemory` | false |
| `extendsMemoryCloud` | true |
| `kernelLayerOnly` | true |
| `vectorSemanticOs` | false |

Env: `LUGEMI_MEMORY_RUNTIME_MODE` (`sandbox`\|`disabled`), `LUGEMI_KERNEL_MEMORY_MAX_ENTRIES`, `LUGEMI_KERNEL_MEMORY_SHORT_TTL_SEC`.

See ADR-0126.
