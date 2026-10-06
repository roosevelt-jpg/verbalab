# Vision Runtime (VL-328)

Library Phase 195 — part of Volume 18 Data Plane Cloud.

## Mission

VerbaLab Vision Runtime is a **thin execution/routing layer** inside the Data Plane Cloud.
It never manages organizations, policies, or billing — that is Control Plane (Volume 17).

## Honesty

- `thinExecutionLayer=true`
- `duplicatesProductLogic=false`
- `managesOrgsPoliciesBilling=false`
- `serviceMeshOs=false` (Service Mesh / VAIOS deferred past Volume 18)
- `thinExecutionLayer=true`

## Routes to (upstream)

- `ocr` → `/v1/ocr` (OCR)
- `documents` → `/v1/documents` (Documents)

## Surfaces

- Console: `/vision-runtime`
- API: `/v1/vision-runtime/engine`
- ADR: [`docs/adr/0230-vision-runtime.md`](./adr/0230-vision-runtime.md)

---

## Volume status

**Volume 18** Data Plane Cloud (VL-324–333). Production Audit evidence: [`docs/data-plane-cloud-audit/`](./data-plane-cloud-audit/).
