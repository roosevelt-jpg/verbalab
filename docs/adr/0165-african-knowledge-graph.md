# ADR-0165: African Knowledge Graph (VL-263)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-263 (library Phase 130)

## Context

Library Phase 130 asks for African Knowledge Graph inside African Intelligence Cloud. Volume 12 must extend Language/Knowledge/Intelligence clouds without regenerating Volumes 1–11, without claiming Neo4j OS / Digital Twin OS / extractive scrape OS, and with honesty for traditional knowledge and high-risk domains.

## Decision

1. Ship **VL-263** as `/african-knowledge-graph` with REST engine/products/monitoring, CQRS catalog slice, GraphQL, OpenAPI, SDK/CLI, and console page.
2. Keep Nest modular monolith; `hexagonalRewrite: false`; CQRS for GraphQL catalog reads.
3. Encode honesty/safety flags in engine catalog responses (consent, medical, investment, official guidance as applicable).
4. Do **not** invent Global Intelligence OS in this phase.

## Consequences

- Product is discoverable from African Intelligence Cloud Foundation catalog.
- Production Audit (VL-270) will verify honesty flags and absence of TODO markers.
