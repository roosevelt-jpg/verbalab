# Speech Runtime (VL-326)

Library Phase 193 — part of Volume 18 Data Plane Cloud.

## Mission

VerbaLab Speech Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `speech-cloud` → `/v1/speech/products` (Speech Cloud products)
- `speech-recognition` → `/v1/speech` (Speech recognition)

## Surfaces

- Console: `/speech-runtime`
- API: `/v1/speech-runtime/engine`
- ADR: [`docs/adr/0228-speech-runtime.md`](./adr/0228-speech-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
