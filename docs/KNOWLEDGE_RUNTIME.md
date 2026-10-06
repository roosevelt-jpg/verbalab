# Knowledge Runtime (VL-329)

Library Phase 196 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Knowledge Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `knowledge-cloud` → `/v1/knowledge-cloud/products` (Knowledge Cloud)
- `knowledge` → `/v1/knowledge` (Knowledge)
- `knowledge-fabric` → `/v1/knowledge-fabric` (Knowledge Fabric)

## Surfaces

- Console: `/knowledge-runtime`
- API: `/v1/knowledge-runtime/engine`
- ADR: [`docs/adr/0231-knowledge-runtime.md`](./adr/0231-knowledge-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
