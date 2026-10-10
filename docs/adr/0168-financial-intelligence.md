# ADR-0168: Financial Intelligence (VL-266)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-266 (library Phase 133)

## Context

Library Phase 133 asks for Financial Intelligence inside African Intelligence Cloud. Volume 12 must extend Language/Knowledge/Intelligence clouds without regenerating Volumes 1–11, without claiming Neo4j OS / Digital Twin OS / extractive scrape OS, and with honesty for traditional knowledge and high-risk domains.

## Decision

1. Ship **VL-266** as `/financial-intelligence` with REST engine/products/monitoring, CQRS catalog slice, GraphQL, OpenAPI, SDK/CLI, and console page.
2. Keep Nest modular monolith; `hexagonalRewrite: false`; CQRS for GraphQL catalog reads.
3. Encode honesty/safety flags in engine catalog responses (consent, medical, investment, official guidance as applicable).
4. Do **not** invent Global Intelligence OS in this phase.

## Consequences

- Product is discoverable from African Intelligence Cloud Foundation catalog.
- Production Audit (VL-270) will verify honesty flags and absence of TODO markers.
