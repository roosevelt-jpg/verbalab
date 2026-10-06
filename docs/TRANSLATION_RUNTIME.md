# Translation Runtime (VL-325)

Library Phase 192 — part of Volume 18 Data Plane Cloud.

## Mission

VerbaLab Translation Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `translate` → `/v1/translate/engine` (Translation Engine)
- `translate` → `/v1/translate` (Translate API)

## Surfaces

- Console: `/translation-runtime`
- API: `/v1/translation-runtime/engine`
- ADR: [`docs/adr/0227-translation-runtime.md`](./adr/0227-translation-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
