# ADR-0125: AI Kernel Foundation (internal hub, not Linux/VAIOS OS)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-214 (library “Phase 81 AI Kernel Foundation” mapped)

## Context

Library Phase 81 asks for VerbaLab AI Kernel as the internal OS of every cloud product — DDD/CQRS/hexagonal/repository/SOLID/event-driven, Kernel/Runtime APIs, SDK, CLI, telemetry, monitoring, Terraform, Docker, Kubernetes — “everything production ready,” without regenerating previous phases.

Volumes 1–7 already ship product clouds, Intelligence, Knowledge, and Inference over Nest + AI Gateway. Inventing a Linux-style OS rewrite (VAIOS) or customer-facing “Kernel product” would violate “extend, don’t regenerate.”

Volume 8 README (`docs/roadmap/volume8-ai-kernel/README_VOLUME8.md`) requires Agent/Workflow/Plugin scoped permissions + sandboxing, and Policy Runtime as a **hard gate** (not log-only).

## Decision

1. **Schedule** AI Kernel as executable **VL-214–223** (library Phases 81–90).
2. **AI Kernel = internal hub** — `customerFacingProduct: false`. Ops console `/ai-kernel` is for discovery, not a marketed end-user product.
3. **Ship:** `/ai-kernel` + `GET /v1/ai-kernel/products|engine|overview|monitoring` + bounded CQRS catalog port + GraphQL `aiKernelRuntimes` + OpenAPI + thin SDK/CLI.
4. **Map, don’t clone:** Document library terms → modules in `docs/AI_KERNEL.md`.
5. **Defer** Memory/Prompt/Context/Reasoning/Agent/Workflow/Plugin/Policy runtimes (VL-215–222) with honesty flags.
6. **Safety from day one:** `agentActionBoundariesRequired`, `policyHardGateRequired`, `policyLogOnlyForbidden` in architecture/safety notes.
7. **Architecture stays:** Nest modular monolith + REST primary; CQRS/hexagonal **slice** for Kernel GraphQL only (`hexagonalRewrite: false`).
8. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform; no Kernel-specific cluster in Foundation.
9. Do **not** regenerate Volumes 1–7 or invent Linux/VAIOS OS parity.

## Consequences

- Kernel runtimes are discoverable from one hub with honest deferred flags and action-safety notes.
- Later phases must wire Policy as a hard gate into Agent/Workflow/Plugin — Foundation only documents the requirement.
- Cloud Blueprint gains an AI Kernel volume starting at Foundation.
