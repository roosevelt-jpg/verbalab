# ADR-0135: Foundation Model Cloud Foundation (honest hub, not trained weights)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-224 (library “Phase 91 Foundation Model Cloud Foundation” mapped)

## Context

Library Phase 91 asks for Foundation Model Cloud as a first-class platform (Atlas…Translate products, DDD/CQRS/hexagonal, REST/GraphQL/SDK/CLI, Terraform/K8s, “everything production ready”) without regenerating previous phases.

ADR-0041 deferred VL-112 (named models as products **on trained weights**) — correctly. Volume 9 README adds a second truth: Cursor **can** ship MLOps/platform scaffolding (pipelines, eval harnesses, registries) but **cannot** train competitive foundation models in an agent session.

## Decision

1. **Schedule** Foundation Model Cloud as executable **VL-224–238** (library Phases 91–105).
2. **Ship VL-224 as an honest hub:** `/foundation-model-cloud` + `GET /v1/foundation-model-cloud/products|engine|overview|monitoring` + bounded CQRS catalog port + GraphQL `foundationModelCloudProducts` + OpenAPI + thin SDK/CLI.
3. **Catalog named families (Atlas…Translate) as `deferred` scaffolds** — no fake trained weights, no OpenAI-replacement OS claims.
4. **Prefer MLOps track next** (Training Platform / Evaluation / Registry / Audit — VL-235–238) per Volume 9 README; named-model scaffold phases (VL-225–234) remain lower priority.
5. **Architecture stays:** Nest modular monolith + REST primary; CQRS slice for GraphQL only (`hexagonalRewrite: false`).
6. **Infra:** Reuse Docker/Fly/Actions/Terraform/EKS from platform; no FM-specific GPU cluster in Foundation.
7. **Supersedes ADR-0041 only for platform scaffolding.** ADR-0041’s ban on claiming trained competitive weights **stands**.
8. Do **not** regenerate Volumes 1–8 or invent frontier-lab parity.

## Consequences

- Model families and MLOps platforms are discoverable from one hub with honest deferred flags.
- Later phases must keep honesty flags true until real data/compute/eval evidence exists.
- Cloud Blueprint gains Foundation Model Cloud starting at Foundation (VL-224).
