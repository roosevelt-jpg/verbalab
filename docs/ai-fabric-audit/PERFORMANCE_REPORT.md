# AI Fabric — Performance Report (VL-248)

## Scope

Sandbox latency smokes inside vitest/supertest. Not a load-test lab or chaos engineering OS.

## Observations

| Check | Result |
| --- | --- |
| Catalog GETs (`/products`) | Sub-20ms in local vitest typical |
| Route/pipeline POSTs | Sub-10ms plan generation (no LLM) |
| Policy assert deny path | Immediate 403 (hard gate) |
| Agent Fabric SSE ticks | Auto-close ~1.1s (bounded stream) |
| Event Fabric memory bus | In-process publish/poll without Redis when `EVENT_FABRIC_MEMORY=1` |

## Scalability notes

- Event Fabric uses Redis Streams when configured; memory fallback for tests/dev
- Fabric routers do not execute heavy Runtime work themselves — handoff plans only
- Entry ceilings remain on Memory/Agent/Policy Runtime modules

## Rejected claims

- No published p99 SLO theater without production traffic samples
- No invented Kafka partition rebalance OS benchmarks
