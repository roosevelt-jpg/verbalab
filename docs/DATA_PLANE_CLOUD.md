# Data Plane Cloud (VL-324)

Library Phase 191 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Data Plane Cloud executes every customer workload via thin runtime hubs that
route to existing product logic (Translation, Speech, Voice, Vision, Knowledge,
Embeddings, Streaming, GPU). It never manages organizations, policies, or billing.

## Honesty

- `managesOrgsPoliciesBilling=false` (Control Plane separation).
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18).
- `thinExecutionLayer=true` on each runtime; `duplicatesProductLogic=false`.
- GPU: `gpuBudgetLimitsRequired=true` (Volume 7 / FinOps).
- Streaming façade: `data-plane-streaming` routes to Volume 7 `streaming-runtime`.

## Surfaces

- Console: `/data-plane-cloud`
- API: `/v1/data-plane-cloud/engine` (foundation: `/products`)
- ADR: [`docs/adr/0226-data-plane-cloud.md`](./adr/0226-data-plane-cloud.md)

---

## Volume status

**Volume 18 closed** (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/). Service Mesh / VAIOS deferred past Volume 18.
