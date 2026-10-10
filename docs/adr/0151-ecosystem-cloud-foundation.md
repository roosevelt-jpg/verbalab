# ADR-0151: Ecosystem Cloud Foundation (marketplace hub, not payment OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-249 (library “Phase 116 Ecosystem Foundation” mapped)

## Context

Library Phase 116 asks for Ecosystem Cloud: extension/plugin/model/agent/workflow/dataset/voice/language/connector/prompt/SDK/template marketplaces plus billing, analytics, monitoring, REST/GraphQL/SDK/CLI/Terraform/K8s — “everything production ready.”

Volume 11 README clarifies this is a **real-money** volume (payments, licensing, royalties). Rolling a custom payment processor or storing raw cards creates PCI liability. Plugin/Agent marketplaces sell executable code and must enforce Volume 8 sandboxes. Creator Economy must hand-check payout math. Inventing a commerce OS or regenerating VL-090+/voice marketplace would violate “extend, don’t regenerate.”

## Decision

1. **Schedule** Ecosystem Cloud as executable **VL-249–259** (library Phases 116–126).  
2. **Ecosystem Cloud = marketplace/monetization hub** — extends VL-090–092 and voice marketplace; `regeneratesVolumes1to10: false`.  
3. **Ship VL-249:** `/ecosystem-cloud` + `GET /v1/ecosystem-cloud/products|engine|routing|overview|monitoring` + CQRS catalog + GraphQL `ecosystemProducts` + OpenAPI + thin SDK/CLI.  
4. **Static product catalog** linking shipped content/voice marketplaces and deferring VL-250–258 with honesty flags.  
5. **Safety from day one:** `stripeOrEquivalentRequired`, `storesRawCardData: false`, `pluginAgentSandboxRequired`, `realMoneyRiskCategory`.  
6. **Architecture stays:** Nest modular monolith; CQRS slice for GraphQL; `hexagonalRewrite: false`; `paymentProcessorOs: false`.  
7. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS; no new payment vault.  
8. Do **not** regenerate Volumes 1–10 or replace VL-090+/voice marketplace.

## Consequences

- Marketplaces are discoverable from one hub with honest deferred work.  
- Plugin/Agent marketplace phases must wire sandbox + Policy hard-gate before third-party execution.  
- Creator Economy (VL-258) must document tax/dispute gaps and verify payout math before live creators.  
- Cloud Blueprint gains Ecosystem Cloud starting at Foundation.
