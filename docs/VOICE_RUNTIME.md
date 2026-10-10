# Voice Runtime (VL-327)

Library Phase 194 — part of Volume 18 Data Plane Cloud.

## Mission

Lugemi Voice Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `voice-cloud` → `/v1/voice-cloud/products` (Voice Cloud products)
- `voice` → `/v1/voice` (Voice API)

## Surfaces

- Console: `/voice-runtime`
- API: `/v1/voice-runtime/engine`
- ADR: [`docs/adr/0229-voice-runtime.md`](./adr/0229-voice-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
