# GPU Runtime (VL-332)

Library Phase 199 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi GPU Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `gpu-platform` → `/v1/gpu-platform/engine` (GPU Platform)
- `gpu-platform` → `/v1/gpu-platform` (GPU Platform API)

## Surfaces

- Console: `/gpu-runtime`
- API: `/v1/gpu-runtime/engine`
- ADR: [`docs/adr/0234-gpu-runtime.md`](./adr/0234-gpu-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
