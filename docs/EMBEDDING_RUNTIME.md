# Embedding Runtime (VL-330)

Library Phase 197 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Embedding Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `embeddings` → `/v1/embeddings` (Embeddings API)
- `embedding-cloud` → `/v1/embedding-cloud/engine` (Embedding Cloud)

## Surfaces

- Console: `/embedding-runtime`
- API: `/v1/embedding-runtime/engine`
- ADR: [`docs/adr/0232-embedding-runtime.md`](./adr/0232-embedding-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
