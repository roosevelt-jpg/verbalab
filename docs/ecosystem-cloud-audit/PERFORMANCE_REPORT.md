# Ecosystem Cloud — Performance Report (VL-259)

## Scope

Sandbox latency smokes inside vitest/supertest. Not a load-test lab or marketplace traffic OS.

## Observations

| Check | Result |
| --- | --- |
| Catalog GETs (`/engine`, `/products`) | Sub-20ms in local vitest typical |
| Royalty scenario GET | Immediate pure-math table |
| Royalty preview POST | Sub-50ms with Policy gate + Pro assert |
| Marketplace publish/install (fixture) | Sub-500ms typical in vitest |
| Unauthenticated sensitive routes | Immediate 401/403 |

## Scalability notes

- Marketplace hubs share Nest modular monolith + Postgres `MarketplaceSale` receipts
- Live Checkout/Connect paths defer to Stripe when configured — no in-process card handling
- Plugin/agent/workflow run paths stay sandboxed (no open outbound execution)

## Rejected claims

- No published marketplace p99 SLO theater without production traffic samples
- No invented Zapier-scale iPaaS load OS benchmarks
