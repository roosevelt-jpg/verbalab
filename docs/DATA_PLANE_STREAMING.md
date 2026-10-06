# Data Plane Streaming (VL-331)

Library Phase 198 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Data Plane Streaming is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `streaming-runtime` → `/v1/streaming-runtime/engine` (Streaming Runtime (Volume 7))
- `streaming-runtime` → `/v1/streaming-runtime` (Streaming Runtime API)

## Surfaces

- Console: `/data-plane-streaming`
- API: `/v1/data-plane-streaming/engine`
- ADR: [`docs/adr/0233-data-plane-streaming.md`](./adr/0233-data-plane-streaming.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
