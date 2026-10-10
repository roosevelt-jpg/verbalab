# Lugemi Agent Fabric

**Status:** Shipped (VL-246 / library Phase 113)  
**Rule:** Agent Fabric is the **internal** agent router over Agent Runtime — **sandboxed + Policy-gated**. Not open agent-orchestration OS, open tool execution, or a customer-facing product. Extends AI Fabric + Agent Runtime. Do **not** regenerate Volumes 1–9 or VL-219. Roadmap: [`docs/roadmap/volume10-ai-fabric/`](./roadmap/volume10-ai-fabric/).

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Agent Fabric | **VL-246** — `/agent-fabric` |
| Agent Router | **Shipped** — `POST /route` |
| Agent Discovery | **Shipped** — Runtime list façade |
| Agent Communication / Collaboration / Messaging | **Partial** — sandbox collaborate façades |
| Agent Scheduling | **Partial** — Runtime schedule stubs |
| Agent Federation | **Partial** — product-handoff catalog |
| Agent Marketplace Integration | **Partial** — listing counts |
| Realtime APIs | **Partial** — SSE ticks (not WebSocket OS) |
| REST / GraphQL / SDK / Monitoring / Docs | **Shipped** |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/agent-fabric` |
| REST catalog | `GET /v1/agent-fabric/products` |
| Routes / pipeline / versions / federate | `GET|POST` under `/v1/agent-fabric/*` |
| Discover / collaborate / schedule / marketplace | Runtime façades |
| Distribute | `POST /distribute` (same-org + optional Event Fabric) |
| Realtime | `GET /stream` (SSE) |
| GraphQL | `agentFabricCapabilities`, `agentFabricRoutes` |
| SDK / CLI | `agentFabricProducts()`, `lugemi agent-fabric-products` |

## Action safety

1. **Sandboxed** — no open/live tool execution.
2. **Policy Runtime** hard-gates Agent Runtime actions today.
3. **Policy Fabric (VL-247)** — must hard-gate across fabric buses, not log-only.

## Honesty

| Flag | Value |
| --- | --- |
| `customerFacingProduct` | false |
| `langGraphOs` / `autoGptOs` | false |
| `openToolExecution` / `liveToolExecution` | false |
| `sandboxed` | true |
| `policyRuntimeHardGate` | true |
| `regeneratesAgentRuntime` | false |
| `fabricWidePolicyHardGateRequired` | true |

See ADR-0148.
