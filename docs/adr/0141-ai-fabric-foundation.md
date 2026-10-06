# ADR-0141: AI Fabric Foundation (internal bus hub, not Kafka OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-239 (library “Phase 106 AI Fabric Foundation” mapped)

## Context

Library Phase 106 asks for AI Fabric as the central communication layer: service discovery, context/identity propagation, distributed messaging, workflow/AI/prompt/knowledge/policy routing, observability — plus REST/SDK/CLI/dashboard/Terraform/K8s.

Volume 10 README clarifies this is buildable messaging infrastructure, not civilization-scale vision. Broker backends (Kafka/NATS/RabbitMQ/Redis Streams) belong primarily to Event Fabric (Phase 107). Inventing a full service mesh or regenerating Volumes 1–9 would violate “extend, don’t regenerate.”

Volume 10 also requires Policy Fabric to be a **hard gate** fabric-wide (same principle as Volume 8 Policy Runtime).

## Decision

1. **Schedule** AI Fabric as executable **VL-239–248** (library Phases 106–115).  
2. **AI Fabric = internal hub** — `customerFacingProduct: false`. Console `/ai-fabric` is ops discovery.  
3. **Ship VL-239:** `/ai-fabric` + `GET /v1/ai-fabric/products|engine|routing|overview|monitoring` + CQRS catalog + GraphQL `aiFabricBuses` + OpenAPI + thin SDK/CLI.  
4. **Static routing catalog** for service discovery over existing cloud/runtime paths.  
5. **Defer** Event/Context/Knowledge/Prompt/Reasoning/Memory/Agent/Policy fabrics (VL-240–247) with honesty flags.  
6. **Safety from day one:** `fabricWidePolicyHardGateRequired`, `policyLogOnlyForbidden`.  
7. **Architecture stays:** Nest modular monolith; CQRS slice for GraphQL; `hexagonalRewrite: false`; `kafkaHyperscalerOs: false`.  
8. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS; no fabric-specific Kafka cluster in Foundation.  
9. Do **not** regenerate Volumes 1–9.

## Consequences

- Fabric buses are discoverable from one hub with honest deferred broker work.  
- Event Fabric (VL-240) must wire a real local/dev broker path (prefer Redis Streams already in stack) without fake Kafka readiness.  
- Policy Fabric (VL-247) must hard-gate, not log-only.  
- Cloud Blueprint gains AI Fabric starting at Foundation.
